/* Automatic updates. No record, credential, configuration or storage migrations. */
(() => {
  'use strict';
  const VERSION = document.querySelector('meta[name="app-version"]').content;
  const base = new URL('./', location.href);
  const INTERVAL = 5 * 60 * 1000;
  const REMIND = 30 * 60 * 1000;
  const controls = 'input:not([type="hidden"]):not([type="button"]):not([type="submit"]),textarea,select';
  const baseline = new WeakMap();
  const dirty = new Set();
  let pendingSaves = 0, registration, offered, checking, applying = false, laterUntil = 0;
  const get = id => document.getElementById(id);
  const state = el => el.type === 'checkbox' || el.type === 'radio' ? String(el.checked) : el.value;
  const tracked = el => el.matches?.(controls) && !el.readOnly && !el.closest('#appUpdateBanner,#appUpdateDialog') && !['pool','historyScope'].includes(el.id);
  function remember(root) {
    if (tracked(root) && !baseline.has(root)) baseline.set(root, state(root));
    root.querySelectorAll?.(controls).forEach(el => {
      if (tracked(el) && !baseline.has(el)) baseline.set(el, state(el));
    });
  }
  remember(document);
  new MutationObserver(records => records.forEach(r => r.addedNodes.forEach(remember)))
    .observe(document.body, {childList:true, subtree:true});
  document.addEventListener('focusin', e => {
    if (tracked(e.target) && !dirty.has(e.target)) baseline.set(e.target, state(e.target));
  }, true);
  for (const type of ['input','change']) document.addEventListener(type, e => {
    const el = e.target;
    if (!tracked(el)) return;
    if (!baseline.has(el)) baseline.set(el, el.type === 'checkbox' || el.type === 'radio' ? String(el.defaultChecked) : el.defaultValue ?? '');
    if (state(el) === baseline.get(el)) dirty.delete(el); else dirty.add(el);
  }, true);
  document.addEventListener('reset', e => {
    // A reset is an explicit user/app discard. Wait for the default reset action.
    setTimeout(() => { if (!e.defaultPrevented) markSaved(e.target); }, 0);
  }, true);
  function hasUnsaved() {
    for (const el of dirty) if (!el.isConnected || state(el) === baseline.get(el)) dirty.delete(el);
    return dirty.size > 0 || pendingSaves > 0;
  }
  function elements(root) {
    return typeof root === 'string' ? [...document.querySelectorAll(root)] : [...(root?.querySelectorAll(controls) || [])];
  }
  function markSaved(root) {
    for (const el of elements(root)) { baseline.set(el, state(el)); dirty.delete(el); }
  }
  function trackLogSaves(logs) {
    const append = logs.append;
    logs.append = async function(kind, record) {
      const root = kind === 'daily' || kind === 'weekly' ? get('logEntryCard') :
        record.mode === 'Routine Test' ? get('routineForm') : record.shock ? get('shockForm') : null;
      const snapshot = elements(root).map(el => [el, state(el)]);
      pendingSaves++;
      try {
        const saved = await append.call(this, kind, record);
        if (saved) for (const [el, value] of snapshot) {
          // Edits made while an asynchronous save was pending are still unsaved.
          baseline.set(el, value);
          if (state(el) === value) dirty.delete(el); else dirty.add(el);
        }
        return saved;
      } finally { pendingSaves--; }
    };
  }
  window.waterAppUpdates = {version:VERSION, hasUnsaved, markSaved, trackLogSaves};
  window.addEventListener('beforeunload', e => {
    if (hasUnsaved()) { e.preventDefault(); e.returnValue = ''; }
  });

  const banner = get('appUpdateBanner'), dialog = get('appUpdateDialog');
  const message = text => { get('appUpdateStatus').textContent = text; get('appUpdateMessage').textContent = text; };
  function newer(a, b) {
    if (!/^\d+\.\d+\.\d+$/.test(a)) return false;
    const left = a.split('.').map(Number), right = b.split('.').map(Number);
    for (let i=0;i<3;i++) { if(left[i] !== right[i]) return left[i] > right[i]; }
    return false;
  }
  function rpc(worker, type, timeout = 12000) {
    return new Promise((resolve, reject) => {
      if (!worker) return reject(Error('No update worker'));
      const channel = new MessageChannel();
      const timer = setTimeout(() => { channel.port1.close(); reject(Error('Update timed out')); }, timeout);
      channel.port1.onmessage = e => {clearTimeout(timer); channel.port1.close(); resolve(e.data);};
      worker.postMessage({type}, [channel.port2]);
    });
  }
  function bounded(promise, milliseconds = 20000) {
    let timer;
    return Promise.race([promise, new Promise((_, reject) => {timer = setTimeout(() => reject(Error('The update check timed out. Please try again.')), milliseconds);})]).finally(() => clearTimeout(timer));
  }
  async function inspectWorker() {
    const worker = registration?.waiting || registration?.active;
    if (!worker) return null;
    const info = await rpc(worker, 'GET_VERSION');
    return newer(info.version, VERSION) ? {worker, version:info.version} : null;
  }
  function showOffer(version, manual) {
    if (applying) return;
    if (offered !== version) { offered = version; laterUntil = 0; }
    message('Version ' + version + ' is available. Save or finish your entries before updating. Saved records and settings are retained.');
    if (manual || Date.now() >= laterUntil) banner.hidden = false;
  }
  async function check(manual = false) {
    if (applying) return;
    if (checking) { await checking; if (manual && offered) showOffer(offered, true); return; }
    checking = (async () => {
      if (manual) message('Checking for updatesâ€¦');
      try {
        if (!navigator.onLine) throw Error('Offline');
        const url = new URL('version.json', base); url.searchParams.set('_', Date.now());
        const response = await fetch(url, {cache:'no-store', signal:AbortSignal.timeout(12000)});
        if (!response.ok) throw Error('Version check failed');
        const latest = await response.json();
        if (!/^\d+\.\d+\.\d+$/.test(latest.version)) throw Error('Invalid release');
        if (newer(latest.version, VERSION)) showOffer(latest.version, manual);
        if (registration) {
          if (!registration.waiting && !registration.installing) await bounded(registration.update());
          const ready = await inspectWorker();
          if (ready) showOffer(ready.version, manual);
        }
        if (!offered) message('You are up to date. Current version: ' + VERSION + '.');
      } catch {
        message(navigator.onLine ? 'Could not check or prepare an update. Your current app is still available. Try again later.' :
          'You are offline. Update checks will resume when connected.');
      }
    })();
    try { await checking; } finally { checking = null; }
  }
  function watchInstall() {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') inspectWorker().then(ready => {
        if (ready && !applying) showOffer(ready.version, false);
      }).catch(() => {});
    });
  }
  async function updateNow() {
    if (applying) return;
    if (hasUnsaved()) {
      banner.hidden = false;
      message('Update paused: you have unfinished entries or a save in progress. Save your entries, or finish/clear the fields you changed, then select Update Now again.');
      return;
    }
    if (!registration) { message('Automatic installation is unavailable in this browser. Save your work, then close and reopen the app online.'); return; }
    applying = true;
    dialog.showModal();
    get('appUpdateProgress').textContent = 'Preparing the updateâ€¦';
    try {
      let ready = await inspectWorker();
      if (!ready) await bounded(registration.update());
      // update() may resolve while precaching is still in progress.
      const until = Date.now() + 45000;
      while (registration.installing && Date.now() < until) await new Promise(resolve => setTimeout(resolve, 250));
      ready = await inspectWorker();
      if (!ready) throw Error('The complete update is not ready yet. Please try again shortly.');
      if (hasUnsaved()) throw Error('An entry or save is unfinished. Finish it before updating.');
      const result = await rpc(ready.worker, 'APPLY_UPDATE');
      if (!result.ok) throw Error(result.reason === 'other-tabs' ?
        'Close other tabs and installed windows of this app, then select Update Now again. Save any entries in those windows first.' : 'The update could not be activated. Please try again.');
      get('appUpdateProgress').textContent = 'Opening version ' + ready.version + 'â€¦';
      const deadline = Date.now() + 15000;
      while (ready.worker.state !== 'activated' && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve,100));
      if (ready.worker.state !== 'activated') throw Error('Activation is taking longer than expected. Try Update Now again.');
      if (hasUnsaved()) throw Error('An entry is unfinished. Finish it before updating.');
      // Keep the customer's exact path, facility/local parameters and setup fragment.
      location.reload();
    } catch (error) {
      dialog.close(); applying = false; banner.hidden = false; message(error.message);
    }
  }
  dialog.addEventListener('cancel', e => e.preventDefault());
  get('appUpdateNow').onclick = updateNow;
  get('appUpdateLater').onclick = () => {laterUntil = Date.now() + REMIND; banner.hidden = true;};
  get('appCheckUpdates').onclick = () => check(true);
  async function launch() {
    if ('serviceWorker' in navigator && window.isSecureContext) {
      try {
        registration = await navigator.serviceWorker.register(new URL('sw.js', base), {scope:base.href, updateViaCache:'none'});
        registration.addEventListener('updatefound', watchInstall);
        watchInstall();
      } catch { message('Background updates are unavailable. Check your connection and reopen the app online.'); }
    }
    await check();
  }
  // No controllerchange reload: another tab or first installation must not refresh a draft.
  window.addEventListener('online', () => check());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  setInterval(() => { if (!document.hidden) check(); }, INTERVAL);
  launch();
})();
