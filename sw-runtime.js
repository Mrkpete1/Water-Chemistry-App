/* Included by prepare-release.py in sw.js; never register this file directly. */
const CACHE = 'chem-v' + RELEASE.version + '-' + self.registration.scope;
const assetURLs = new Map(Object.entries(RELEASE.files).map(([path, hash]) => [new URL(path, self.registration.scope).href, hash]));
const indexURL = new URL('index.html', self.registration.scope).href;
const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2,'0')).join('');
self.addEventListener('install', event => event.waitUntil((async () => {
  // Verify every core file before this worker can become waiting/active. A partial
  // deployment must never replace a complete installed release.
  const downloaded = await Promise.all([...assetURLs].map(async ([url, hash]) => {
    const response = await fetch(url, {cache:'no-store'});
    if (!response.ok || response.redirected || hex(await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer())) !== hash)
      throw Error('Release file missing or mismatched: ' + url);
    return [url, response];
  }));
  const cache = await caches.open(CACHE);
  await Promise.all(downloaded.map(([url, response]) => cache.put(url, response)));
  // Deliberately do not skipWaiting here.
})()));
self.addEventListener('message', event => {
  const port = event.ports[0];
  if (!port) return;
  if (event.data?.type === 'GET_VERSION') { port.postMessage({version:RELEASE.version}); return; }
  if (event.data?.type !== 'APPLY_UPDATE') return;
  event.waitUntil((async () => {
    const source = event.source;
    if (!source?.url?.startsWith(self.registration.scope)) {port.postMessage({ok:false}); return;}
    const windows = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    if (windows.some(client => client.id !== source.id && client.url.startsWith(self.registration.scope))) {
      port.postMessage({ok:false, reason:'other-tabs'}); return;
    }
    await self.skipWaiting();
    port.postMessage({ok:true});
  })());
});
self.addEventListener('activate', event => event.waitUntil((async () => {
  // Only this app's scoped code caches. Never touch localStorage, IndexedDB,
  // Firebase data, unrelated origin caches, or unscoped legacy caches.
  for (const key of await caches.keys()) {
    if (key !== CACHE && key.startsWith('chem-v') && key.endsWith('-' + self.registration.scope)) await caches.delete(key);
  }
  // No claim(): the initial install must not take over an already loading page.
})()));
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;
  // Version discovery and registration always go to the network. Firebase,
  // media, PDFs not listed in the release and other origins are not cached here.
  if (url.pathname.endsWith('/version.json') || url.pathname.endsWith('/sw.js')) {
    event.respondWith(fetch(request, {cache:'no-store'})); return;
  }
  const canonical = url.origin + url.pathname;
  const key = request.mode === 'navigate' && (canonical === self.registration.scope || canonical === indexURL) ? indexURL : canonical;
  if (!assetURLs.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE), cached = await cache.match(key);
    if (cached) return cached;
    // Browser eviction recovery must not mix a new published file into an old release.
    const response = await fetch(key, {cache:'no-store'});
    if (!response.ok || hex(await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer())) !== assetURLs.get(key))
      return new Response('This app version is incomplete. Reconnect and check for updates.', {status:503});
    await cache.put(key, response.clone()); return response;
  })());
});
