const resourcesEditor=document.createElement('div');resourcesEditor.id='resourcesEditor';
$('setupChoices').after(resourcesEditor);
function renderResourceEditor(){
 resourcesEditor.innerHTML='';if(!templatesUnlocked)return;
 const record=customerRecords.find(r=>r.setup.id===editingRecord);
 resourcesEditor.innerHTML='<h3>Pool Manuals & Tips</h3><p>Add HTTPS links to the manuals this facility needs. Anyone with the setup link can read these notes and links. Use restricted document sharing for private manuals. Do not enter passwords, access credentials, or sensitive service codes.</p>'+setupChoices.map((p,i)=>{
  const r=record?.setup.pools.find(x=>keyPool(x)===keyPool(p))?.r||defaultResourcesFor(p)?.r||{manuals:[],tips:'',notes:''};
  const profile=record?.setup.pools.find(x=>keyPool(x)===keyPool(p))?.m||defaultResourcesFor(p)?.m||p.m||(p.n==='350'?'hw350-revb':'none');
  return '<details id="resourceChoice'+i+'" class="hidden"><summary>'+esc(p.n)+' — '+f(p.g)+' GAL resources</summary><button type="button" class="secondary" onclick="saveResourceChoiceDefault('+i+')">Save These as Pool Defaults</button><button type="button" class="secondary" onclick="loadResourceChoiceDefault('+i+')">Load Saved Defaults</button><label for="resourceProfile'+i+'">Maintenance instructions for this pool</label><select id="resourceProfile'+i+'"><option value="none" '+(profile==='none'?'selected':'')+'>No model-specific schedule yet</option><option value="hw350-revb" '+(profile==='hw350-revb'?'selected':'')+'>HYDROWORX 350 - OWNER MANUAL REV B (2021)</option></select><label for="resourceLinks'+i+'">Manuals / documents (one per line: title | HTTPS link, up to 5)</label><textarea id="resourceLinks'+i+'" rows="3" placeholder="Owner’s Manual | https://… | 2027-07-01">'+esc(r.manuals.map(m=>m.title+' | '+m.url+(m.expires?' | '+m.expires:'')).join('\n'))+'</textarea><label for="resourceTips'+i+'">Tips & tricks</label><textarea id="resourceTips'+i+'" rows="4" maxlength="1500">'+esc(r.tips)+'</textarea><label for="resourceNotes'+i+'">Operating notes / non-sensitive codes</label><textarea id="resourceNotes'+i+'" rows="2" maxlength="300">'+esc(r.notes)+'</textarea></details>';
 }).join('');updateResourceChoices();
}
function updateResourceChoices(){
 $('setupChoices').querySelectorAll('input').forEach(c=>$('resourceChoice'+c.value)?.classList.toggle('hidden',!c.checked));
}
$('setupChoices').addEventListener('change',updateResourceChoices);
function resourceForChoice(i){
 const manuals=$('resourceLinks'+i).value.split('\n').filter(l=>l.trim()).map(line=>{
  const parts=line.split('|').map(x=>x.trim());if(parts.length<2||parts.length>3)throw Error('Use title | HTTPS link | optional YYYY-MM-DD expiration.');
  return {title:parts[0],url:parts[1],...(parts[2]?{expires:parts[2]}:{})};
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
 const manualCards=r.manuals.map((m,i)=>{
  const days=m.expires?Math.ceil((new Date(m.expires+'T23:59:59').getTime()-Date.now())/86400000):null;
  const expired=days!==null&&days<=0;
  const status=expired?'🔴 Link expiration date has passed. Contact your HydroWorx representative for a replacement link.':days!==null&&days<=30?'🟡 Link expires in '+days+' day(s). Download your copy now.':m.expires?'🟢 Link expires '+m.expires+'.':'This sharing link may expire approximately 9 months after it was issued.';
  return '<section class="manual-download-card" style="border:1px solid #9daab8;border-radius:10px;padding:14px;margin:12px 0"><h4>'+esc(m.title)+'</h4><p>'+esc(status)+'</p><p><strong>IMPORTANT: DOWNLOAD AND SAVE YOUR MANUAL.</strong> This company-sharing link is temporary. Open the document and use the download option in the HydroWorx document viewer to save an authorized copy before access expires.</p><p><strong>Copyright and distribution:</strong> This manual is provided for the equipment owner and authorized facility personnel. Do not reproduce, redistribute, or publicly share it without permission from the copyright holder.</p><label style="display:flex;align-items:start;gap:8px"><input type="checkbox" class="manual-ack" data-manual="'+i+'" style="width:auto;margin-top:4px"> I understand the download reminder and sharing restrictions.</label><a class="secondary manual-open" data-manual="'+i+'" style="display:block;padding:13px;border-radius:10px;text-decoration:none;font-weight:700;overflow-wrap:anywhere;opacity:.5;pointer-events:none" target="_blank" rel="noopener noreferrer" aria-disabled="true" href="'+esc(m.url)+'">OPEN &amp; DOWNLOAD MANUAL ↗</a></section>';
 }).join('');
 customerResourcesCard.innerHTML='<h3>Your Pool Resources</h3><p><b>'+esc(selected.n)+'</b></p>'+manualCards+(r.tips?'<h4>Tips & Tricks</h4><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(r.tips)+'</p>':'')+(r.notes?'<h4>Operating Notes</h4><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(r.notes)+'</p>':'');
 customerResourcesCard.querySelectorAll('.manual-ack').forEach(box=>box.addEventListener('change',()=>{const link=customerResourcesCard.querySelector('.manual-open[data-manual="'+box.dataset.manual+'"]');link.style.pointerEvents=box.checked?'auto':'none';link.style.opacity=box.checked?'1':'.5';link.setAttribute('aria-disabled',box.checked?'false':'true')}));
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
