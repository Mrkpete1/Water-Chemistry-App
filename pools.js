let templatesUnlocked=false,editingTemplate=false;
const sortedPools=rows=>[...rows].sort((a,b)=>a.n.localeCompare(b.n,'en',{numeric:true,sensitivity:'base'})||a.id.localeCompare(b.id));
function render(){
 const rows=all();if(sid&&!rows.some(p=>p.id===sid)){sid='';localStorage.removeItem('sid')}
 $('pool').innerHTML=rows.length?`<option value="" ${sid?'':'selected'} disabled>Select a pool/system</option>`+rows.map(x=>`<option value="${esc(x.id)}" ${x.id===sid?'selected':''}>${esc(x.n)} — ${f(x.g)} GAL</option>`).join(''):'<option>No pools — add one in Manage Pools</option>';
 $('pool').disabled=!rows.length;$('hdr').textContent=sid&&cur()?`${cur().n} • ${f(cur().g)} GAL`:'';
 $('plist').innerHTML=C.length?sortedPools(C).map(x=>{const i=C.indexOf(x);return `<p><b>${esc(x.n)}</b> — ${f(x.g)} GAL${x.facility?'<br>'+esc(x.facility):''}<button class="secondary" onclick="editPool(${i})">Edit</button><button class="secondary" onclick="del(${i})">Delete</button></p>`}).join(''):'<p>No saved pools yet.</p>';
 $('standards').innerHTML=P.length?sortedPools(P).map(x=>{const i=P.indexOf(x);return `<p><b>${esc(x.n)}</b> — ${f(x.g)} GAL <button class="secondary" onclick="editTemplate(${i})" ${templatesUnlocked?'':'disabled'}>Edit Template</button><button class="secondary" onclick="deleteTemplate(${i})" ${templatesUnlocked?'':'disabled'}>Delete Template</button></p>`}).join(''):'<p>No standard templates. You can still add custom pools.</p>';
 $('templateStatus').textContent=templatesUnlocked?'Templates unlocked for this session.':'Templates locked.';
 $('unlockTemplates').textContent='Unlock Templates';
 $('unlockTemplates').classList.toggle('hidden',templatesUnlocked);$('lockTemplates').classList.toggle('hidden',!templatesUnlocked);
}
function cancelEdit(){editing=null;editingTemplate=false;$('pn').value=$('pg').value=$('pf').value='';$('pf').disabled=false;$('poolFormTitle').textContent='Add Pool'}
function editPool(i){const x=C[i];if(!x)return;editingTemplate=false;editing=x.id;$('pn').value=x.n;$('pg').value=x.g;$('pf').disabled=false;$('pf').value=x.facility||'';$('poolFormTitle').textContent='Edit Pool';scrollTo(0,0)}
function editTemplate(i){if(!templatesUnlocked)return notify('Unlock templates first.');const x=P[i];if(!x)return;editingTemplate=true;editing=x.id;$('pn').value=x.n;$('pg').value=x.g;$('pf').value='';$('pf').disabled=true;$('poolFormTitle').textContent='Edit Standard Template';scrollTo(0,0)}
function addPool(){
 const n=$('pn').value.trim().toUpperCase(),g=Number($('pg').value),facility=$('pf').value.trim().toUpperCase();if(!n||!Number.isFinite(g)||g<=0)return alert('Enter a pool name and a positive gallon volume.');
 if(editingTemplate){if(!templatesUnlocked)return notify('Unlock templates first.');if(!P.some(x=>x.id===editing))return notify('Template no longer exists.');const next=P.map(x=>x.id===editing?{...x,n,g}:x);persist('standardPoolsV52',next);P=next}
 else{const id=editing||uid(),next={id,n,g,facility};const rows=editing?C.map(x=>x.id===id?next:x):[...C,next];persist('pools',rows);C=rows;editing=id}
 sid=editing;save();cancelEdit();render();notify('Saved. Existing records retain their original name and volume.')
}
function del(i){const x=C[i];if(!x||!confirm(`Delete ${x.n}? Existing test history and logs will be retained.`))return;const next=C.filter(p=>p.id!==x.id);persist('pools',next);C=next;cancelEdit();render();save();notify('Pool deleted. Records remain in All pools history.')}
function deleteTemplate(i){if(!templatesUnlocked)return notify('Unlock templates first.');const x=P[i];if(!x||!confirm(`Delete standard template ${x.n} (${f(x.g)} GAL)? Existing history and logs will be retained. Custom pools will not change.`))return;const next=P.filter(p=>p.id!==x.id);persist('standardPoolsV52',next);P=next;cancelEdit();render();save();notify('Template deleted. Records remain in All pools history.')}
function lockTemplates(){templatesUnlocked=false;if(editingTemplate)cancelEdit();render()}
function openPassword(){ $('passwordTitle').textContent='Unlock Templates';$('passwordHint').textContent='Enter the template-management password.';$('templatePass').value='';$('passwordError').textContent='';$('passwordDialog').showModal();$('templatePass').focus()}
async function passwordDigest(password,salt){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new Uint8Array(salt),iterations:210000,hash:'SHA-256'},key,256);return Array.from(new Uint8Array(bits),b=>b.toString(16).padStart(2,'0')).join('')}
async function submitPassword(event){event.preventDefault();$('passwordSubmit').disabled=true;try{
 if(!TEMPLATE_AUTH?.hash)throw new Error('Template password has not been configured.');
 if(await passwordDigest($('templatePass').value,TEMPLATE_AUTH.salt)!==TEMPLATE_AUTH.hash)throw new Error('Incorrect password.');
 templatesUnlocked=true;$('passwordDialog').close();$('templatePass').value='';render();notify('Templates unlocked. Lock when finished.');
 }catch(e){$('passwordError').textContent=e.message||'Unable to verify password.'}finally{$('passwordSubmit').disabled=false}}
window.addEventListener('storage',e=>{if(e.key==='standardPoolsV52'){P=localStorage.getItem('standardPoolsV52')===null?DEFAULT_P.map(x=>({...x})):readStore('standardPoolsV52');lockTemplates()}});
