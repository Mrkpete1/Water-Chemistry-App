// Setup links contain presets, not credentials or customer records.
function decodeCustomerSetup(hash){
 const raw=new URLSearchParams(hash.replace(/^#/, '')).get('setup');
 if(!raw)return null;
 if(raw.length>16000)throw Error('Setup link is too long.');
 const data=JSON.parse(raw);
 if(data.v!==1||typeof data.facility!=='string'||data.facility.length>120||!Array.isArray(data.pools)||!data.pools.length||data.pools.length>30)throw Error('Invalid customer setup.');
 const pools=data.pools.map(p=>{if(typeof p.n!=='string'||!p.n.trim()||p.n.length>120||!Number.isFinite(p.g)||p.g<=0||p.g>10000000)throw Error('Invalid pool in setup link.');return {n:p.n.trim().toUpperCase(),g:p.g,...(p.r?{r:validatePoolResources(p.r)}:{})}});
 return {facility:data.facility.trim().toUpperCase(),pools};
}
function applyCustomerSetup(){
 try{
  const setup=decodeCustomerSetup(location.hash);if(!setup)return;
  if(localStorage.getItem('customerSetupV535'))return;
  // Never replace customized standard templates on an already configured device.
  if(localStorage.getItem('standardPoolsV52')!==null){notify('This browser already has configured presets. Existing pools and logs were kept. Open the setup link in a new browser profile or device to use it.');return}
  const next=setup.pools.map((p,i)=>({...p,id:'customer-'+crypto.randomUUID(),p:1,facility:setup.facility}));
  persist('standardPoolsV52',next);localStorage.setItem('customerSetupV535',JSON.stringify(setup));
  P=next;sid='';localStorage.removeItem('sid');render();
  notify('Customer presets loaded'+(setup.facility?' for '+setup.facility:'')+'. Select a pool to begin.');
 }catch(e){notify('Customer setup could not be loaded. Existing pools were kept.')}
}
const setupCard=document.createElement('div');setupCard.className='card';
setupCard.innerHTML='<h3>Create Customer Setup Link</h3><p>Select the systems this customer owns. The link installs these presets on an unconfigured browser. Existing custom pools and logs stay on that device.</p><button class="secondary" id="setupUnlock">Unlock Setup Tool</button><div id="setupOwner" class="hidden"><label for="setupFacility">Facility name (optional)</label><input id="setupFacility" maxlength="120"><div id="setupChoices"></div><button id="makeSetupLink">Create Link</button><div id="setupOutput" class="hidden"><label for="setupLink">Customer link</label><textarea id="setupLink" readonly rows="4"></textarea><button class="secondary" id="copySetupLink">Copy Link</button><p>Send this link to the customer. Anyone with it can read the facility name and presets. It does not share logs or sync devices.</p></div></div>';
$('manage').appendChild(setupCard);
let setupChoices=[];
function renderSetupTool(){
 $('setupOwner').classList.toggle('hidden',!templatesUnlocked);$('setupUnlock').classList.toggle('hidden',templatesUnlocked);
 if(!templatesUnlocked){$('setupOutput').classList.add('hidden');$('setupLink').value='';return}
 setupChoices=all();$('setupChoices').innerHTML=setupChoices.map((p,i)=>'<label class="check"><input type="checkbox" value="'+i+'"> '+esc(p.n)+' — '+f(p.g)+' GAL</label>').join('');
}
const renderBeforeSetup=render;render=function(){renderBeforeSetup();renderSetupTool()};
$('setupUnlock').onclick=()=>openPassword();
$('makeSetupLink').onclick=()=>{
 if(!templatesUnlocked)return;
 const pools=[...$('setupChoices').querySelectorAll('input:checked')].map(c=>{const p=setupChoices[Number(c.value)];return {n:p.n,g:p.g}});
 if(!pools.length)return notify('Select at least one pool/system.');
 if(pools.length>30)return notify('Choose at most 30 pools for one link.');
 const url=new URL(location.href);url.hash='';url.search='';url.hash=new URLSearchParams({setup:JSON.stringify({v:1,facility:$('setupFacility').value.trim(),pools})}).toString();
 $('setupLink').value=url.href;$('setupOutput').classList.remove('hidden');
};
$('copySetupLink').onclick=async()=>{if(!templatesUnlocked)return;try{await navigator.clipboard.writeText($('setupLink').value);notify('Customer link copied.')}catch(e){$('setupLink').focus();$('setupLink').select();notify('Select and copy the customer link.')}};
renderSetupTool();
window.addEventListener('hashchange',applyCustomerSetup);
