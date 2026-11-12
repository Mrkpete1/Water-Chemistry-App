const appStorage = window.facilityStorage;
function readStore(key){try{const value=JSON.parse(appStorage.getItem(key)||'[]');return Array.isArray(value)?value:[]}catch(e){alert('Unable to read '+key+'. Original stored data has not been overwritten. Export or recover your browser data before continuing.');throw e}}
function persist(key,value){try{appStorage.setItem(key,JSON.stringify(value))}catch(e){alert('Storage failed. This change was not saved. Export your records and check browser storage.');throw e}}
