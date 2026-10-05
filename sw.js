const CACHE='chem-v5.3.6-'+self.registration.scope;
const FILES=['./','./index.html','./storage.js','./chemistry.js','./app.js','./shock.js','./customer-setup.js','./customer-records.js','./contact-buttons.js','./pools.js','./template-auth.js','./manifest.json','./icon.svg','./Taylor-Troubleshooting.pdf'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k==='chem-v4'||(k.startsWith('chem-v5')&&k.endsWith(self.registration.scope)&&k!==CACHE)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(self.registration.scope)||e.request.url.includes('/videos/'))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return r}).catch(()=>caches.open(CACHE).then(c=>c.match(e.request))))});


