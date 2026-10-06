const resourcesEditor=document.createElement('div');resourcesEditor.id='resourcesEditor';
$('setupChoices').after(resourcesEditor);
function renderResourceEditor(){
 resourcesEditor.innerHTML='';if(!templatesUnlocked)return;
 const record=customerRecords.find(r=>r.setup.id===editingRecord);
 resourcesEditor.innerHTML='<h3>Pool Manuals & Tips</h3><p>Add HTTPS links to the manuals this facility needs. Anyone with the setup link can read these notes and links. Use restricted document sharing for private manuals. Do not enter passwords, access credentials, or sensitive service codes.</p>'+setupChoices.map((p,i)=>{
  const r=record?.setup.pools.find(x=>keyPool(x)===keyPool(p))?.r||{manuals:[],tips:'',notes:''};
  return '<details id="resourceChoice'+i+'" class="hidden"><summary>'+esc(p.n)+' — '+f(p.g)+' GAL resources</summary><label for="resourceLinks'+i+'">Manuals / documents (one per line: title | HTTPS link, up to 5)</label><textarea id="resourceLinks'+i+'" rows="3" placeholder="Owner’s Manual | https://…">'+esc(r.manuals.map(m=>m.title+' | '+m.url).join('\n'))+'</textarea><label for="resourceTips'+i+'">Tips & tricks</label><textarea id="resourceTips'+i+'" rows="4" maxlength="1500">'+esc(r.tips)+'</textarea><label for="resourceNotes'+i+'">Operating notes / non-sensitive codes</label><textarea id="resourceNotes'+i+'" rows="2" maxlength="300">'+esc(r.notes)+'</textarea></details>';
 }).join('');updateResourceChoices();
}
function updateResourceChoices(){
 $('setupChoices').querySelectorAll('input').forEach(c=>$('resourceChoice'+c.value)?.classList.toggle('hidden',!c.checked));
}
$('setupChoices').addEventListener('change',updateResourceChoices);
function resourceForChoice(i){
 const manuals=$('resourceLinks'+i).value.split('\n').filter(l=>l.trim()).map(line=>{
  const separator=line.indexOf('|');if(separator<1)throw Error('Enter each document as title | HTTPS link.');
  return {title:line.slice(0,separator).trim(),url:line.slice(separator+1).trim()};
 });
 return validatePoolResources({manuals,tips:$('resourceTips'+i).value,notes:$('resourceNotes'+i).value});
}
const renderSetupBeforeResources=renderSetupTool;
renderSetupTool=function(){renderSetupBeforeResources();renderResourceEditor()};
const saveSetupBeforeResources=$('makeSetupLink').onclick;
$('makeSetupLink').onclick=()=>{try{saveSetupBeforeResources()}catch(e){notify(e.message||'Check the pool resource fields.')}};
const customerResourcesCard=document.createElement('div');customerResourcesCard.className='card hidden';customerResourcesCard.id='customerResourcesCard';
$('home').append(customerResourcesCard);
function renderCustomerResources(){
 customerResourcesCard.replaceChildren();customerResourcesCard.classList.add('hidden');
 let setup;try{setup=JSON.parse(localStorage.getItem('customerSetupV535')||'null')}catch(e){return}
 const selected=cur();if(!setup||!selected)return;
 // Match the installed pool ID so local pool renames do not lose resources.
 const source=setup.pools.find(p=>setup.poolIds?.[keyPool(p)]===selected.id)||setup.pools.find(p=>keyPool(p)===keyPool(selected));
 let r;try{r=source?.r?validatePoolResources(source.r):null}catch(e){return}
 if(!r||(!r.manuals.length&&!r.tips&&!r.notes))return;
 customerResourcesCard.innerHTML='<h3>Your Pool Resources</h3><p><b>'+esc(selected.n)+'</b></p>'+r.manuals.map(m=>'<p><a class="secondary" style="display:block;padding:13px;border-radius:10px;text-decoration:none;font-weight:700;overflow-wrap:anywhere" target="_blank" rel="noopener noreferrer" href="'+esc(m.url)+'">'+esc(m.title)+'</a></p>').join('')+(r.tips?'<h4>Tips & Tricks</h4><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(r.tips)+'</p>':'')+(r.notes?'<h4>Operating Notes</h4><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(r.notes)+'</p>':'');
 customerResourcesCard.classList.remove('hidden');
}
const renderBeforeResources=render;render=function(){renderBeforeResources();renderCustomerResources()};
window.addEventListener('storage',e=>{if(e.key==='customerSetupV535'||e.key===null)renderCustomerResources()});
renderSetupTool();renderCustomerResources();
