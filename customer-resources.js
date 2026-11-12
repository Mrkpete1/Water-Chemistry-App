const resourcesEditor=document.createElement('div');resourcesEditor.id='resourcesEditor';
$('setupChoices').after(resourcesEditor);
function renderResourceEditor(){
 resourcesEditor.innerHTML='';if(!templatesUnlocked)return;
 const record=customerRecords.find(r=>r.setup.id===editingRecord);
 resourcesEditor.innerHTML='<h3>Pool Manuals & Tips</h3><p>Owner’s Manuals are assigned automatically by model from the PDF library above. Upload each model’s manual once, then export and publish the library. Optional legacy Owner’s Manual links remain supported. Anyone with the setup link can read these notes and links. Use restricted document sharing for private manuals. Do not enter passwords, access credentials, or sensitive service codes.</p>'+setupChoices.map((p,i)=>{
  const r=record?.setup.pools.find(x=>keyPool(x)===keyPool(p))?.r||defaultResourcesFor(p)?.r||{manuals:[],tips:'',notes:''};
  const profile=record?.setup.pools.find(x=>keyPool(x)===keyPool(p))?.m||defaultResourcesFor(p)?.m||p.m||(p.n==='350'?'hw350-revb':'none');
  return '<details id="resourceChoice'+i+'" class="hidden"><summary>'+esc(p.n)+' — '+f(p.g)+' GAL resources</summary><button type="button" class="secondary" onclick="saveResourceChoiceDefault('+i+')">Save These as Pool Defaults</button><button type="button" class="secondary" onclick="loadResourceChoiceDefault('+i+')">Load Saved Defaults</button><div data-owner-manual-model="'+esc(p.n)+'">'+ownerManualCard(p.n,true)+'</div><label for="resourceProfile'+i+'">Maintenance instructions for this pool</label><select id="resourceProfile'+i+'"><option value="none" '+(profile==='none'?'selected':'')+'>No model-specific schedule yet</option><option value="hw350-revb" '+(profile==='hw350-revb'?'selected':'')+'>HYDROWORX 350 - OWNER MANUAL REV B (2021)</option></select><label for="resourceLinks'+i+'">Legacy Owner’s Manual links only (title | HTTPS link, up to 5)</label><textarea id="resourceLinks'+i+'" rows="3" placeholder="Owner’s Manual | https://…">'+esc(r.manuals.map(m=>m.title+' | '+m.url).join('\n'))+'</textarea><label for="resourceTips'+i+'">Tips & tricks</label><textarea id="resourceTips'+i+'" rows="4" maxlength="1500">'+esc(r.tips)+'</textarea><label for="resourceNotes'+i+'">Operating notes / non-sensitive codes</label><textarea id="resourceNotes'+i+'" rows="2" maxlength="300">'+esc(r.notes)+'</textarea></details>';
 }).join('');updateResourceChoices();
}
function updateResourceChoices(){
 $('setupChoices').querySelectorAll('input').forEach(c=>$('resourceChoice'+c.value)?.classList.toggle('hidden',!c.checked));
}
$('setupChoices').addEventListener('change',updateResourceChoices);
function resourceForChoice(i){
 const manuals=$('resourceLinks'+i).value.split('\n').filter(l=>l.trim()).map(line=>{
  const parts=line.split('|').map(x=>x.trim());if(parts.length<2||parts.length>3)throw Error('Use Owner’s Manual title | HTTPS link.');
  return {title:parts[0],url:parts[1]};
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
 const selected=cur();if(!selected)return;
 let setup=null;try{setup=JSON.parse(appStorage.getItem('customerSetupV535')||'null')}catch(e){}
 // Original setup model survives local pool renames and custom gallon changes.
 const source=setup?.pools?.find(p=>setup.poolIds?.[keyPool(p)]===selected.id)||setup?.pools?.find(p=>keyPool(p)===keyPool(selected));
 const model=source?.n || PRESET_CATALOG.find(p=>p.id===selected.id)?.n || selected.n;
 let r={manuals:[],tips:'',notes:''};try{if(source?.r)r=validatePoolResources(source.r)}catch(e){}
 let manualCards=ownerManualCard(model);
 // Keep existing owner-manual links usable during migration, with no app expiry.
 if(!manualForModel(model) && r.manuals.length){
  manualCards=r.manuals.map(m=>'<section class="manual-download-card"><h4>'+esc(m.title)+'</h4>'+ownerManualNotice+'<a target="_blank" rel="noopener noreferrer" href="'+esc(m.url)+'">View / Download Owner’s Manual</a></section>').join('');
 }
 customerResourcesCard.innerHTML='<h3>Your Pool Resources</h3><p><b>'+esc(selected.n)+'</b></p>'+manualCards+compactPoolCare(model)+(r.tips?'<h4>Tips & Tricks</h4><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(r.tips)+'</p>':'')+(r.notes?'<h4>Operating Notes</h4><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(r.notes)+'</p>':'');
 customerResourcesCard.classList.remove('hidden');
}
const renderBeforeResources=render;render=function(){renderBeforeResources();renderCustomerResources()};
window.addEventListener('storage',e=>{if(e.key==='customerSetupV535'||e.key===null)renderCustomerResources()});
renderSetupTool();renderCustomerResources();

// Home dashboard shortcut: opens the selected pool's manual section.
function openSelectedPoolManual(){
 renderCustomerResources();
 const cards=customerResourcesCard.querySelectorAll('.manual-download-card');
 if(!cards.length){notify('No owner\'s manual is assigned to this pool. Contact your facility administrator.');return;}
 show('home');
 customerResourcesCard.scrollIntoView({behavior:'smooth',block:'start'});
 cards[0].style.outline='3px solid #155d8d';
 setTimeout(()=>{cards[0].style.outline='';},2200);
}
function updateHomeManualButton(){
 const btn=$('homeManualButton');if(!btn)return;
 btn.title='View the owner\'s manual for the selected pool';
}
updateHomeManualButton();
