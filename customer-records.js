// Saved links and revisions are local to the owner's browser.
let customerRecords=readStore('customerLinksV536'),editingRecord=null;
const keyPool=p=>JSON.stringify([p.n,p.g]);
const keyLegacy=s=>JSON.stringify([s.facility,s.pools.map(keyPool).sort()]);
const decodeOriginalSetup=decodeCustomerSetup;
decodeCustomerSetup=function(hash){
 const raw=new URLSearchParams(hash.replace(/^#/, '')).get('setup');if(!raw)return null;
 if(raw.length>16000)throw Error('Setup link is too long.');const d=JSON.parse(raw);if(d.v!==2)return decodeOriginalSetup(hash);
 if(typeof d.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(d.id)||!Number.isSafeInteger(d.rev)||d.rev<1)throw Error('Invalid revision');
 const checked=decodeOriginalSetup('#'+new URLSearchParams({setup:JSON.stringify({...d,v:1})}));
 return {...checked,v:2,id:d.id,rev:d.rev,legacy:typeof d.legacy==='string'?d.legacy:undefined};
};
// The original listener is removed before replacing it.
window.removeEventListener('hashchange',applyCustomerSetup);
applyCustomerSetup=function(){try{
 const s=decodeCustomerSetup(location.hash);if(!s)return;
 const old=JSON.parse(localStorage.getItem('customerSetupV535')||'null');
 if(old){
  if(s.v!==2||(old.id?s.id!==old.id:s.legacy!==keyLegacy(old))){return}
  if(old.id&&s.rev<=(old.rev||1))return;
  const seen=new Set(old.seen||old.pools.map(keyPool));const next=[...P];let count=0;
  for(const p of s.pools){const key=keyPool(p);if(seen.has(key))continue;seen.add(key);if([...next,...C].some(x=>keyPool(x)===key))continue;next.push({...p,id:'customer-'+crypto.randomUUID(),p:1,facility:s.facility});count++}
  persist('standardPoolsV52',next);persist('customerSetupV535',{...s,seen:[...seen],poolIds:{...Object.fromEntries(next.map(p=>[keyPool(p),p.id])),...(old.poolIds||{})}});P=next;render();notify(count+' new pool preset(s) added. Existing pools and logs kept.');return;
 }
 if(localStorage.getItem('standardPoolsV52')!==null){notify('Existing presets kept. Use a separate browser profile for this customer setup.');return}
 const next=s.pools.map(p=>({...p,id:'customer-'+crypto.randomUUID(),p:1,facility:s.facility}));persist('standardPoolsV52',next);persist('customerSetupV535',{...s,seen:s.pools.map(keyPool),poolIds:Object.fromEntries(next.map(p=>[keyPool(p),p.id]))});P=next;sid='';localStorage.removeItem('sid');render();notify('Customer presets loaded. Select a pool to begin.');
}catch(e){notify('Setup could not be loaded. Existing pools were kept.')}};
function recordURL(s){const u=new URL(location.href);u.hash='';u.search='';u.hash=new URLSearchParams({setup:JSON.stringify(s)}).toString();return u.href}
$('setupOwner').insertAdjacentHTML('beforeend','<h3>Saved Customer Links</h3><p>Records stay in this browser. Export a backup regularly. Updated links add pools; send the new link to the customer. Old links do not change automatically.</p><div id="customerRecords"></div><button class="secondary" id="newCustomerRecord">New Customer</button><button class="secondary" id="exportCustomerRecords">Export Links Backup</button><label>Restore links backup<input type="file" id="restoreCustomerRecords" accept=".json"></label><label for="importCustomerLink">Previously created customer link</label><textarea id="importCustomerLink"></textarea><button class="secondary" id="saveOldCustomerLink">Save Existing Link</button>');
function renderCustomerRecords(){
 $('customerRecords').innerHTML=customerRecords.length?customerRecords.map((r,i)=>'<div class="entry"><b>'+esc(r.setup.facility||'Unnamed customer')+'</b><p>'+r.setup.pools.map(p=>esc(p.n)+' — '+f(p.g)+' GAL').join('<br>')+'</p><p class="muted">Revision '+r.setup.rev+' · '+esc(r.updated)+'</p><button class="secondary" onclick="editCustomerRecord('+i+')">Add Pools / Edit Link</button><button class="secondary" onclick="showCustomerRecord('+i+')">Show / Copy Link</button></div>').join(''):'<p>No saved links yet.</p>';
}
function showCustomerRecord(i){if(!templatesUnlocked)return;$('setupLink').value=recordURL(customerRecords[i].setup);$('setupOutput').classList.remove('hidden')}
function editCustomerRecord(i){if(!templatesUnlocked)return;editingRecord=customerRecords[i].setup.id;$('setupFacility').value=customerRecords[i].setup.facility;renderSetupTool();showCustomerRecord(i)}
const originalRenderSetup=renderSetupTool;
renderSetupTool=function(){originalRenderSetup();if(!templatesUnlocked){editingRecord=null;return}const r=customerRecords.find(r=>r.setup.id===editingRecord);if(r){const kept=r.setup.pools;setupChoices=[...kept,...all().filter(p=>!kept.some(k=>keyPool(k)===keyPool(p)))];$('setupChoices').innerHTML=setupChoices.map((p,i)=>'<label class="check"><input type="checkbox" value="'+i+'" '+(i<kept.length?'checked disabled':'')+'> '+esc(p.n)+' — '+f(p.g)+' GAL</label>').join('')}$('makeSetupLink').textContent=r?'Save Updated Link':'Create and Save Link';renderCustomerRecords()};
$('newCustomerRecord').onclick=()=>{if(!templatesUnlocked)return;editingRecord=null;$('setupFacility').value='';$('setupOutput').classList.add('hidden');renderSetupTool()};
$('makeSetupLink').onclick=()=>{if(!templatesUnlocked)return;const facility=$('setupFacility').value.trim().toUpperCase();if(!facility)return notify('Enter a customer or facility name.');const pools=[...$('setupChoices').querySelectorAll('input:checked')].map(c=>{const p=setupChoices[Number(c.value)];return {n:p.n,g:p.g,r:resourceForChoice(Number(c.value))}});if(!pools.length||pools.length>30)return notify('Choose between 1 and 30 pools.');const prior=customerRecords.find(r=>r.setup.id===editingRecord);const setup={v:2,id:prior?.setup.id||crypto.randomUUID(),rev:(prior?.setup.rev||0)+1,facility,pools,...(prior?.setup.legacy?{legacy:prior.setup.legacy}:{})};if(JSON.stringify(setup).length>16000)return notify('This setup is too long. Shorten the tips or reduce the number of document links.');const record={setup,updated:new Date().toISOString()},next=prior?customerRecords.map(r=>r===prior?record:r):[...customerRecords,record];persist('customerLinksV536',next);customerRecords=next;editingRecord=setup.id;renderSetupTool();showCustomerRecord(customerRecords.indexOf(record));notify('Customer link saved.')};
$('saveOldCustomerLink').onclick=()=>{if(!templatesUnlocked)return;try{const s=decodeCustomerSetup(new URL($('importCustomerLink').value).hash);if(!s)throw Error();const setup=s.v===2?s:{...s,v:2,id:crypto.randomUUID(),rev:1,legacy:keyLegacy(s)};if(customerRecords.some(r=>r.setup.id===setup.id||setup.legacy&&r.setup.legacy===setup.legacy))return notify('This link is already saved.');const next=[...customerRecords,{setup,updated:new Date().toISOString()}];persist('customerLinksV536',next);customerRecords=next;renderCustomerRecords();notify('Existing link saved.')}catch(e){notify('Enter a valid customer setup link.')}};
$('exportCustomerRecords').onclick=()=>{if(!templatesUnlocked)return;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({version:1,customers:customerRecords},null,2)],{type:'application/json'}));a.download='customer-links-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
$('restoreCustomerRecords').onchange=async e=>{if(!templatesUnlocked)return;try{const file=e.target.files[0];if(!file||file.size>2000000)throw Error();const data=JSON.parse(await file.text());if(!templatesUnlocked)return;if(data.version!==1||!Array.isArray(data.customers)||data.customers.length>1000)throw Error();const incoming=data.customers.map(r=>{const setup=decodeCustomerSetup('#'+new URLSearchParams({setup:JSON.stringify(r.setup)}));if(!setup||setup.v!==2)throw Error();return {setup,updated:String(r.updated||'Restored').slice(0,100)}});const next=[...customerRecords];for(const r of incoming){const i=next.findIndex(x=>x.setup.id===r.setup.id);if(i<0)next.push(r);else if(r.setup.rev>next[i].setup.rev)next[i]=r}persist('customerLinksV536',next);customerRecords=next;renderCustomerRecords();notify('Backup restored.')}catch(e){notify('Could not restore backup. Existing records kept.')}e.target.value=''};
const facilityCard=document.createElement('div');
facilityCard.id='facilityCard';facilityCard.className='card hidden';
facilityCard.innerHTML='<p class="muted">FACILITY</p><h2 id="facilityName" style="overflow-wrap:anywhere;margin:0"></h2>';
$('home').prepend(facilityCard);
function renderFacilityName(){
 let name='';try{const setup=JSON.parse(localStorage.getItem('customerSetupV535')||'null');if(typeof setup?.facility==='string')name=setup.facility.trim()}catch(e){}
 $('facilityName').textContent=name;facilityCard.classList.toggle('hidden',!name);
}
const renderBeforeFacility=render;render=function(){renderBeforeFacility();renderFacilityName()};
window.addEventListener('storage',e=>{if(e.key==='customerSetupV535'||e.key===null)renderFacilityName()});
applyCustomerSetup();renderSetupTool();renderFacilityName();window.addEventListener('hashchange',applyCustomerSetup);
