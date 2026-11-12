import { firebaseConfig, loginDomain } from './firebase-config.js';

const panel = document.querySelector('#facilitySignIn');
const form = document.querySelector('#facilityLoginForm');
const status = document.querySelector('#facilityLoginStatus');
const signOutButton = document.querySelector('#facilitySignOut');
const retryButton = document.querySelector('#facilityRetry');
const syncStatus = document.querySelector('#facilitySyncStatus');

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = resolve;
    script.onerror = () => reject(new Error('App files could not be loaded.'));
    document.head.append(script);
  });
}

function facilitySetup(raw) {
  const setup = JSON.parse(raw);
  if (typeof setup.name !== 'string' || !setup.name.trim() || setup.name.length > 120 ||
      !Array.isArray(setup.pools) || setup.pools.length < 1 || setup.pools.length > 30) {
    throw new Error('Invalid facility setup.');
  }
  const ids = new Set();
  const name = setup.name.trim();
  const pools = setup.pools.map(pool => {
    if (!/^[a-z0-9-]{1,60}$/.test(pool.id) || ids.has(pool.id) ||
        typeof pool.n !== 'string' || !pool.n.trim() || pool.n.length > 120 ||
        !Number.isFinite(pool.g) || pool.g <= 0 || pool.g > 10000000) {
      throw new Error('Invalid facility pool.');
    }
    ids.add(pool.id);
    return { id: pool.id, n: pool.n.trim().toUpperCase(), g: pool.g, p: 1, facility: name };
  });
  return { name, pools };
}

async function start() {
  if (!firebaseConfig?.apiKey || !firebaseConfig?.projectId ||
      !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(loginDomain)) {
    status.textContent = 'Facility sign-in has not been configured yet.';
    return;
  }

  const sdk = 'https://www.gstatic.com/firebasejs/13.2.0/';
  const [{ initializeApp }, authSdk, dbSdk] = await Promise.all([
    import(sdk + 'firebase-app.js'),
    import(sdk + 'firebase-auth.js'),
    import(sdk + 'firebase-firestore.js')
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = authSdk.getAuth(app);
  const db = dbSdk.getFirestore(app);
  let openingUid = null;
  let unsubscribe;
  let lastStatus = '';

  const updateSyncStatus = text => {
    lastStatus = text;
    syncStatus.textContent = text;
  };

  async function leaveFacility() {
    try {
      await authSdk.signOut(auth);
    } catch {
      status.textContent = 'Sign-out failed. Try again.';
      syncStatus.textContent = 'Sign-out failed. Try again.';
    }
  }

  signOutButton.onclick = leaveFacility;
  document.querySelector('#facilityCancelSession').onclick = leaveFacility;
  retryButton.onclick = () => location.reload();
  form.onsubmit = async event => {
    event.preventDefault();
    const username = form.elements.username.value.trim().toLowerCase().replaceAll('’', "'");
    if (!/^[a-z0-9][a-z0-9'-]{0,59}$/.test(username)) {
      status.textContent = 'Enter the facility username using letters, numbers, hyphens, or apostrophes.';
      return;
    }
    const button = form.querySelector('button[type=submit]');
    button.disabled = true;
    status.textContent = 'Signing in…';
    try {
      await authSdk.setPersistence(auth, form.elements.remember.checked ?
        authSdk.browserLocalPersistence : authSdk.browserSessionPersistence);
      await authSdk.signInWithEmailAndPassword(auth, username + '@' + loginDomain,
        form.elements.password.value);
      form.reset();
    } catch (error) {
      status.textContent = error.code === 'auth/network-request-failed' ?
        'Could not connect. Check your connection and try again.' :
        'Sign-in failed. Check the facility username and password, then try again.';
    } finally {
      button.disabled = false;
    }
  };

  authSdk.onAuthStateChanged(auth, async user => {
    if (openingUid && user?.uid !== openingUid) {
      unsubscribe?.();
      document.body.classList.remove('facility-open');
      document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
      location.reload();
      return;
    }
    if (!user) {
      status.textContent = 'Use the username and password provided for your facility.';
      form.hidden = false;
      return;
    }
    if (openingUid) return;
    openingUid = user.uid;
    form.hidden = true;
    document.querySelector('#facilityCancelSession').hidden = false;
    status.textContent = 'Loading your facility…';
    try {
      const facility = dbSdk.doc(db, 'facilities', user.uid);
      const profile = await dbSdk.getDocFromServer(facility);
      if (!profile.exists()) throw new Error('Facility profile missing.');
      const setup = facilitySetup(profile.data().setup);
      if (auth.currentUser?.uid !== user.uid) return;
      const prefix = 'waterChemistryFacility:' + firebaseConfig.projectId + ':' + user.uid + ':';
      const poolIds = Object.fromEntries(setup.pools.map(p => [JSON.stringify([p.n, p.g]), p.id]));
      const provisioned = new Map([
        ['standardPoolsV52', JSON.stringify(setup.pools)],
        ['customerSetupV535', JSON.stringify({ facility: setup.name, pools: setup.pools, poolIds })],
        ['pools', '[]']
      ]);
      window.facilityStorage = {
        getItem: key => provisioned.has(key) ? provisioned.get(key) : localStorage.getItem(prefix + key),
        setItem: (key, value) => {
          if (!provisioned.has(key)) localStorage.setItem(prefix + key, value);
        },
        removeItem: key => {
          if (!provisioned.has(key)) localStorage.removeItem(prefix + key);
        }
      };
      const logs = dbSdk.collection(facility, 'logs');
      let saveInProgress = false;
      let confirmed = false;
      let pending;
      window.facilityLogs = {
        async append(kind, record) {
          if (saveInProgress) return false;
          if (!confirmed || auth.currentUser?.uid !== user.uid || !navigator.onLine) {
            notify('Shared history is offline. Keep this form open and try again when connected.');
            return false;
          }
          const { id, date, ...contents } = record;
          const payload = JSON.stringify(contents);
          if (payload.length > 16000) {
            notify('This entry is too long. Shorten the notes and try again.');
            return false;
          }
          const fingerprint = JSON.stringify([kind, kind === 'history' ? '' : date, payload]);
          const draft = pending?.fingerprint === fingerprint ?
            pending : { id, date, fingerprint };
          pending = draft;
          const ref = dbSdk.doc(logs, draft.id);
          saveInProgress = true;
          signOutButton.disabled = true;
          updateSyncStatus('Saving to shared history…');
          try {
            await dbSdk.runTransaction(db, async tx => {
              const existing = await tx.get(ref);
              if (!existing.exists()) tx.set(ref, {
                kind, date: draft.date, payload, savedAt: dbSdk.serverTimestamp()
              });
            });
            pending = undefined;
            updateSyncStatus('Connected to shared history');
            return auth.currentUser?.uid === user.uid;
          } catch {
            updateSyncStatus('Save could not be confirmed');
            notify('The save could not be confirmed. Retry with the same details to avoid a duplicate.');
            return false;
          } finally {
            saveInProgress = false;
            signOutButton.disabled = false;
          }
        }
      };

      const scripts = document.querySelector('#facilityAppScripts').textContent.trim().split(/\s+/);
      for (const script of scripts) await loadScript(script);
      if (auth.currentUser?.uid !== user.uid) return;
      const refreshStatus = () => {
        syncStatus.textContent = navigator.onLine ? lastStatus : 'Offline · new entries cannot be saved';
      };
      window.addEventListener('offline', refreshStatus);
      window.addEventListener('online', refreshStatus);
      unsubscribe = dbSdk.onSnapshot(dbSdk.query(logs, dbSdk.orderBy('savedAt', 'desc')),
        { includeMetadataChanges: true }, snapshot => {
          if (auth.currentUser?.uid !== user.uid) return;
          if (snapshot.metadata.fromCache) {
            confirmed = false;
            updateSyncStatus('Reconnecting · showing last synced history');
            return;
          }
          confirmed = true;
          const records = { history: [], daily: [], weekly: [] };
          for (const entry of snapshot.docs) {
            const { kind, date, payload } = entry.data();
            if (!Object.hasOwn(records, kind) || entry.metadata.hasPendingWrites) continue;
            try {
              const data = JSON.parse(payload);
              if (!data || typeof data.poolId !== 'string' || typeof data.pool !== 'string' ||
                  !Number.isFinite(data.gallons)) continue;
              records[kind].push({ ...data, id: entry.id, date });
            } catch {
              // Ignore malformed records from manual database edits.
            }
          }
          replaceFacilityHistory(records);
          if (!saveInProgress) updateSyncStatus('Connected to shared history');
          document.querySelector('#facilityBannerName').textContent = setup.name;
          panel.hidden = true;
          document.body.classList.add('facility-open');
        }, () => {
          confirmed = false;
          document.body.classList.remove('facility-open');
          document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
          panel.hidden = false;
          status.textContent = 'Could not open shared history. Contact the app administrator or try again.';
          retryButton.hidden = false;
        });
    } catch {
      status.textContent = 'Could not load your facility. Contact the app administrator or try again.';
      retryButton.hidden = false;
    }
  });
}

start().catch(() => {
  status.textContent = 'Could not connect to sign-in. Check your connection and reload.';
  retryButton.hidden = false;
});
