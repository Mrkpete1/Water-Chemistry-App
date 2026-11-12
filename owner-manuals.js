// Static-site manual library: published PDFs are shared; IndexedDB holds admin drafts.
const ownerManualNotice = '<p><strong>Owner’s Manual — Copyright and Authorized Use</strong><br>This HydroWorx Owner’s Manual is provided for the customer and authorized facility personnel for reference, operation, and maintenance of the equipment. Unauthorized copying, redistribution, or public sharing is prohibited without permission from HydroWorx. You may download and keep an authorized copy. There is no app-imposed expiration.</p>';
const manualModelKey = name => String(name || '').trim().replace(/\s+/g, ' ').toUpperCase();
let publishedManuals = [], draftManuals = [], manualLibraryError = '', manualLibraryLoaded = false;
function validateManualManifest(data) {
 if(data?.version !== 1 || !Array.isArray(data.manuals) || data.manuals.length > 500) throw Error('Invalid owner’s manual library.');
 const seen = new Set();
 return data.manuals.map(m => {
  if(typeof m.model !== 'string' || !m.model.trim() || m.model.length > 120 || m.kind !== 'owner' || !/^manuals\/[a-zA-Z0-9_-]+\.pdf$/.test(m.file)) throw Error('Invalid owner’s manual entry.');
  const model = manualModelKey(m.model);
  if(seen.has(model)) throw Error('Only one owner’s manual is allowed per model.');
  seen.add(model); return {model, kind:'owner', file:m.file};
 });
}
function manualDB() {
 return new Promise((resolve,reject) => {
  const request = indexedDB.open('hydroworxOwnerManuals',1);
  request.onupgradeneeded = () => request.result.createObjectStore('manuals',{keyPath:'model'});
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(Error('Manual storage is unavailable. Allow browser storage and try again.'));
 });
}
async function manualStore(action,value) {
 const db = await manualDB();
 try { return await new Promise((resolve,reject) => {
  const tx = db.transaction('manuals',action==='getAll'?'readonly':'readwrite');
  const req = tx.objectStore('manuals')[action](...(value===undefined?[]:[value]));
  tx.oncomplete=()=>resolve(req.result); tx.onerror=()=>reject(tx.error); tx.onabort=()=>reject(tx.error || Error('Manual storage failed.'));
 }); } finally { db.close(); }
}
async function refreshManualDrafts() {
 const rows = await manualStore('getAll');
 draftManuals.forEach(m=>URL.revokeObjectURL(m.url));
 draftManuals = rows.map(m=>({...m,url:URL.createObjectURL(m.blob)}));
}
function manualForModel(name,preview=false) {
 const model = manualModelKey(name);
 const draft = preview && draftManuals.find(m=>m.model===model);
 if(draft) return {...draft,draft:true};
 const m = publishedManuals.find(m=>m.model===model);
 return m ? {...m,url:new URL('../'+m.file,document.baseURI).href} : null;
}
function ownerManualCard(name,preview=false) {
 const m = manualForModel(name,preview);
 if(!m) return '<p>'+esc(manualLibraryError || (manualLibraryLoaded?'No owner’s manual has been published for '+name+'. Contact your HydroWorx representative.':'Loading owner’s manuals…'))+'</p>';
 return '<section class="manual-download-card" style="border:1px solid #9daab8;border-radius:10px;padding:14px;margin:12px 0"><h4>'+esc(m.model)+' Owner’s Manual (PDF)</h4>'+ownerManualNotice+(m.draft?'<p><strong>Local draft preview — export and publish before customers can access this PDF.</strong></p>':'')+'<p><a class="secondary" target="_blank" rel="noopener noreferrer" href="'+esc(m.url)+'">View Owner’s Manual</a></p><p><a class="secondary" download="'+esc(m.model.replace(/[^a-zA-Z0-9_-]/g,'-'))+'-Owners-Manual.pdf" href="'+esc(m.url)+'">Download Owner’s Manual</a></p></section>';
}
function refreshManualViews() {
 document.querySelectorAll('[data-owner-manual-model]').forEach(el=>el.innerHTML=ownerManualCard(el.dataset.ownerManualModel,true));
 if(typeof renderCustomerResources==='function') renderCustomerResources();
 if(typeof renderManualAdmin==='function') renderManualAdmin();
}
const manualAdmin = document.createElement('details');
manualAdmin.innerHTML='<summary>Owner’s Manual PDF Library — Once per Model</summary><p>Upload one Owner’s Manual PDF for each model. All gallon sizes using that exact model name share the manual. Installation manuals are excluded.</p><p>Uploads are saved in this browser as drafts. Export the library ZIP, extract it, and publish its manuals folder alongside this app. Customers then receive the published manual automatically, including customers with existing setup links.</p><label for="ownerManualModel">Model</label><select id="ownerManualModel"></select><label for="ownerManualPdf">Owner’s Manual PDF (maximum 30 MB)</label><input id="ownerManualPdf" type="file" accept=".pdf,application/pdf"><label class="check"><input id="ownerManualConfirm" type="checkbox"> I confirm this is an Owner’s Manual, not an installation manual, and I am authorized to distribute it.</label><button id="saveOwnerManual" type="button">Save Model Manual Draft</button><button id="discardOwnerManual" class="secondary" type="button">Discard Selected Model Draft</button><button id="exportOwnerManuals" type="button">Export Manual Library ZIP for Publishing</button><p id="ownerManualStatus" role="status"></p><div id="ownerManualPreview"></div>';
$('setupOwner').prepend(manualAdmin);
function renderManualAdmin() {
 const sel=$('ownerManualModel'), selected=sel.value;
 const models=[...new Set([...PRESET_CATALOG,...all(),...publishedManuals.map(m=>({n:m.model})),...draftManuals.map(m=>({n:m.model}))].map(p=>manualModelKey(p.n)))].sort();
 sel.innerHTML='<option value="">Select model</option>'+models.map(m=>'<option value="'+esc(m)+'">'+esc(m)+'</option>').join('');
 sel.value=models.includes(selected)?selected:'';
 $('ownerManualStatus').textContent=manualLibraryError || publishedManuals.length+' published manual(s); '+draftManuals.length+' local draft(s).';
 $('ownerManualPreview').innerHTML=sel.value?ownerManualCard(sel.value,true):'';
}
$('ownerManualModel').onchange=()=>{$('ownerManualPreview').innerHTML=$('ownerManualModel').value?ownerManualCard($('ownerManualModel').value,true):''};
async function validateOwnerPdf(file,confirmed) {
 if(!confirmed) throw Error('Confirm authorized Owner’s Manual use first.');
 if(!file || !/\.pdf$/i.test(file.name) || /install(?:ation|er)?/i.test(file.name)) throw Error('Choose an Owner’s Manual PDF. Installation manuals are excluded.');
 if(file.size===0 || file.size>30*1024*1024) throw Error('Choose a PDF up to 30 MB.');
 if(await file.slice(0,5).text()!=='%PDF-') throw Error('This file is not a valid PDF.');
}
$('saveOwnerManual').onclick=async()=>{
 if(!templatesUnlocked)return;
 try {
  const model=$('ownerManualModel').value, file=$('ownerManualPdf').files[0];
  if(!model)throw Error('Select a model first.');
  await validateOwnerPdf(file,$('ownerManualConfirm').checked);
  if(!templatesUnlocked)return;
  if(manualForModel(model,true) && !confirm('Replace the owner’s manual draft for '+model+'?'))return;
  await manualStore('put',{model,kind:'owner',blob:file}); await refreshManualDrafts();
  $('ownerManualPdf').value='';$('ownerManualConfirm').checked=false;refreshManualViews();
  notify('Manual draft saved. Export and publish the library to share it with customers.');
 } catch(e){notify(e.message || 'Could not save the PDF. Existing manuals were kept.');}
};
$('discardOwnerManual').onclick=async()=>{
 if(!templatesUnlocked)return;
 try { const model=$('ownerManualModel').value;if(!draftManuals.some(m=>m.model===model))throw Error('Select a model with a local draft.');
  if(!confirm('Discard the local draft for '+model+'? The published manual stays available.'))return;
  await manualStore('delete',model);await refreshManualDrafts();refreshManualViews();
 }catch(e){notify(e.message)}
};
// Small standards-compliant ZIP writer (stored entries; no third-party runtime dependency).
function manualZip(files) {
 const enc=new TextEncoder(), parts=[], central=[];let offset=0;
 function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
 for(const file of files){
  const name=enc.encode(file.name), bytes=file.bytes, crc=crc32(bytes), head=new Uint8Array(30+name.length), h=new DataView(head.buffer);
  h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,bytes.length,true);h.setUint32(22,bytes.length,true);h.setUint16(26,name.length,true);head.set(name,30);
  const dir=new Uint8Array(46+name.length), d=new DataView(dir.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(14,33,true);d.setUint32(16,crc,true);d.setUint32(20,bytes.length,true);d.setUint32(24,bytes.length,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);dir.set(name,46);
  parts.push(head,bytes);central.push(dir);offset+=head.length+bytes.length;
 }
 const end=new Uint8Array(22), e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,central.reduce((n,b)=>n+b.length,0),true);e.setUint32(16,offset,true);
 return new Blob([...parts,...central,end],{type:'application/zip'});
}
$('exportOwnerManuals').onclick=async()=>{
 if(!templatesUnlocked)return;
 const button=$('exportOwnerManuals');button.disabled=true;
 try {
  if(!manualLibraryLoaded || manualLibraryError)throw Error('The published library must load successfully before export. Reload the app and try again.');
  const models=[...new Set([...publishedManuals,...draftManuals].map(m=>m.model))].sort(), entries=[], files=[];let total=0;
  for(const model of models){
   const draft=draftManuals.find(m=>m.model===model);let bytes;
   if(draft)bytes=new Uint8Array(await draft.blob.arrayBuffer());
   else {const m=manualForModel(model), response=await fetch(m.url);if(!response.ok)throw Error('Could not retrieve '+model+' PDF. Nothing exported.');bytes=new Uint8Array(await response.arrayBuffer());}
   if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('Invalid published PDF for '+model+'.');
   total+=bytes.length;if(total>250*1024*1024)throw Error('Library exceeds the 250 MB export limit. Publish PDFs directly using the README instructions.');
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');
   const file='manuals/owner-'+hash+'.pdf';entries.push({model,kind:'owner',file});if(!files.some(f=>f.name===file))files.push({name:file,bytes});
  }
  if(!templatesUnlocked)return;
  files.push({name:'manuals/manifest.json',bytes:new TextEncoder().encode(JSON.stringify({version:1,manuals:entries},null,2))});
  const url=URL.createObjectURL(manualZip(files)), a=document.createElement('a');a.href=url;a.download='HydroWorx-Owner-Manual-Library.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
  notify('Library exported. Extract and publish the manuals folder with your app.');
 }catch(e){notify(e.message)}finally{button.disabled=false;}
};
const renderSetupBeforeOwnerManuals=renderSetupTool;
renderSetupTool=function(){renderSetupBeforeOwnerManuals();if(templatesUnlocked)renderManualAdmin();else manualAdmin.open=false;};
(async()=>{
 try {const response=await fetch(new URL('../manuals/manifest.json',document.baseURI));if(!response.ok)throw Error();publishedManuals=validateManualManifest(await response.json());}
 catch(e){manualLibraryError='Owner’s manual library could not be loaded. Reload online or contact your HydroWorx representative.';}
 manualLibraryLoaded=true;
 try {await refreshManualDrafts();}catch(e){/* Published manuals remain usable when local storage is unavailable. */}
 refreshManualViews();
})();
