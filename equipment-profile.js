// Pool IDs, rather than names, keep equipment attached through pool renames.
const EQUIPMENT_KEY='poolEquipmentProfilesV552';
const EQUIPMENT_TYPES=['pump','filter','heater','chiller','sanitizer'];
const equipmentTitle=type=>type.charAt(0).toUpperCase()+type.slice(1);
let equipmentProfiles=readStore(EQUIPMENT_KEY);
const baseEquipmentTasks=maintenanceTasks;
function equipmentProfile(poolId=cur()?.id){return equipmentProfiles.find(p=>p.poolId===poolId)||{poolId,equipment:{},links:{},tasks:[]}}
function equipmentSummary(type,profile=equipmentProfile()){
 const e=profile.equipment[type];
 return e?.status==='installed'?[equipmentTitle(type),e.brand,e.model,e.serial?'Serial: '+e.serial:''].filter(Boolean).join(' · '):'';
}
function equipmentTaskType(task,profile=equipmentProfile()){
 return Object.prototype.hasOwnProperty.call(profile.links,task.id)?profile.links[task.id]:(task.equipmentType||({'monthly-filter':'filter','weekly-tabs':'sanitizer'}[task.id])||'');
}
maintenanceTasks=function(){
 const profile=equipmentProfile();
 return [...baseEquipmentTasks(),...profile.tasks.map(t=>({...t,group:'Equipment-specific',action:'equipment'}))].map(t=>{
  const type=equipmentTaskType(t,profile),summary=equipmentSummary(type,profile);
  return {...t,equipmentType:type,equipmentSnapshot:summary,description:[t.description,summary?'Linked equipment: '+summary:'',type&&profile.equipment[type]?.status==='absent'?'Equipment marked not installed. Review whether this task applies before recording work.':''].filter(Boolean).join(' ')};
 });
};
function storeEquipmentProfile(profile){
 const next=[...equipmentProfiles.filter(p=>p.poolId!==profile.poolId),profile];
 persist(EQUIPMENT_KEY,next);equipmentProfiles=next;
}
const equipmentSection=document.createElement('section');equipmentSection.id='equipmentProfile';equipmentSection.className='hidden';
document.querySelector('main').appendChild(equipmentSection);
function equipmentOptions(value,empty='No equipment link'){
 return '<option value="">'+empty+'</option>'+EQUIPMENT_TYPES.map(t=>'<option value="'+t+'" '+(value===t?'selected':'')+'>'+equipmentTitle(t)+'</option>').join('');
}
function renderEquipmentProfile(){
 const pool=cur();
 if(!pool){equipmentSection.innerHTML='<div class="card"><h2>Customer Equipment Profile</h2><p>Select a pool on Home first.</p><button onclick="show(\'home\')">Home</button></div>';return}
 const profile=equipmentProfile();
 equipmentSection.innerHTML='<div class="card"><h2>Customer Equipment Profile</h2><p>'+esc(pool.n)+' — '+f(pool.g)+' GAL</p><p>Equipment details stay with this pool in this browser. Save changes before leaving this screen. Back up profiles regularly; customer setup links do not include these details.</p></div><form id="equipmentForm"><div class="card">'+EQUIPMENT_TYPES.map(type=>{
  const e=profile.equipment[type]||{};
  return '<details open><summary>'+equipmentTitle(type)+'</summary><label for="eq-'+type+'-status">Installation status</label><select id="eq-'+type+'-status">'+[['unknown','Not recorded'],['installed','Installed'],['absent','Not installed']].map(([v,n])=>'<option value="'+v+'" '+((e.status||'unknown')===v?'selected':'')+'>'+n+'</option>').join('')+'</select>'+[['brand','Manufacturer / brand',120],['model','Model number',120],['serial','Serial number',120],['notes','Equipment / service notes',1000]].map(([key,label,max])=>'<label for="eq-'+type+'-'+key+'">'+label+'</label><'+(key==='notes'?'textarea':'input')+' id="eq-'+type+'-'+key+'" maxlength="'+max+'" '+(key==='notes'?'>'+esc(e[key]||'')+'</textarea>':'value="'+esc(e[key]||'')+'">')).join('')+'</details>';
 }).join('')+'</div><div class="card"><h3>Maintenance task links</h3><p>Filter cleaning and feeder service have default links. Link other tasks as appropriate for the installed equipment. Links do not change service intervals, chemistry calculations, or model instructions. Marking equipment not installed keeps tasks and earlier records available.</p>'+baseEquipmentTasks().map((t,i)=>'<label for="eq-link-'+i+'">'+esc(t.name)+'</label><select id="eq-link-'+i+'" data-task="'+esc(t.id)+'">'+equipmentOptions(equipmentTaskType(t,profile))+'</select>').join('')+'<button type="submit">Save Equipment Profile</button><button type="button" class="secondary" onclick="renderEquipmentProfile()">Discard Unsaved Changes</button><p id="equipmentSaved" role="status"></p></div></form><div class="card"><h3>Equipment-specific maintenance tasks</h3><p>Use the installed equipment’s manual or your service provider’s schedule. No manufacturer interval is inferred from a model number. Saved tasks appear in the maintenance checklist.</p><div id="equipmentTaskList">'+profile.tasks.map((t,i)=>'<div class="entry"><b>'+esc(t.name)+'</b><p>'+esc(equipmentTitle(t.equipmentType))+' · Every '+t.days+' day(s)</p><p>'+esc(t.description)+'</p><button class="secondary" type="button" onclick="editEquipmentTask('+i+')">Edit Task</button><button class="secondary" type="button" onclick="removeEquipmentTask('+i+')">Delete Task</button></div>').join('')+'</div><form id="equipmentTaskForm"><input id="eqTaskId" type="hidden"><label for="eqTaskName">Task name</label><input id="eqTaskName" required maxlength="160"><label for="eqTaskType">Equipment</label><select id="eqTaskType" required>'+equipmentOptions('','Select equipment')+'</select><label for="eqTaskDays">Repeat every (days)</label><input id="eqTaskDays" type="number" required min="1" max="3650" step="1"><label for="eqTaskNote">Procedure / source of interval</label><textarea id="eqTaskNote" maxlength="1000"></textarea><button type="submit">Save Maintenance Task</button><button class="secondary" type="button" onclick="document.getElementById(\'equipmentTaskForm\').reset()">Cancel Task Edit</button></form></div><div class="card"><button class="secondary" id="exportEquipmentProfiles">Back Up All Equipment Profiles & Tasks</button><label for="restoreEquipmentProfiles">Restore equipment profiles & tasks</label><input id="restoreEquipmentProfiles" type="file" accept=".json"><p>Restore matches original pool IDs and replaces matching equipment profiles and tasks. Keep your original saved pools when moving browser data. Profiles for deleted pools are retained in backups.</p><button type="button" onclick="show(\'maintenanceTracker\')">Open Maintenance Checklist</button><button class="secondary" onclick="show(\'home\')">Back to Home</button></div>';
 $('equipmentForm').onsubmit=saveEquipmentProfile;
 $('equipmentTaskForm').onsubmit=saveEquipmentTask;
 $('exportEquipmentProfiles').onclick=()=>downloadJSON('equipment-profiles-backup.json',{version:1,profiles:equipmentProfiles});
 $('restoreEquipmentProfiles').onchange=restoreEquipmentProfiles;
}
function saveEquipmentProfile(event){
 event.preventDefault();if(!cur())return;
 const profile={...equipmentProfile(),equipment:{},links:{...equipmentProfile().links}};
 for(const type of EQUIPMENT_TYPES){profile.equipment[type]={};for(const field of ['status','brand','model','serial','notes'])profile.equipment[type][field]=$('eq-'+type+'-'+field).value.trim()}
 equipmentSection.querySelectorAll('select[data-task]').forEach(select=>profile.links[select.dataset.task]=select.value);
 storeEquipmentProfile(profile);$('equipmentSaved').textContent='Equipment profile saved for '+cur().n+'.';
}
function editEquipmentTask(i){
 const t=equipmentProfile().tasks[i];if(!t)return;
 $('eqTaskId').value=t.id;$('eqTaskName').value=t.name;$('eqTaskType').value=t.equipmentType;$('eqTaskDays').value=t.days;$('eqTaskNote').value=t.description;$('eqTaskName').focus();
}
function saveEquipmentTask(event){
 event.preventDefault();if(!cur())return;
 const name=$('eqTaskName').value.trim(),days=Number($('eqTaskDays').value),type=$('eqTaskType').value;
 if(!name||!EQUIPMENT_TYPES.includes(type)||!Number.isInteger(days)||days<1||days>3650)return notify('Enter a task name, equipment type and a whole interval from 1–3650 days.');
 const profile=equipmentProfile(),id=$('eqTaskId').value||'eq-'+uid(),task={id,name,days,equipmentType:type,description:$('eqTaskNote').value.trim()};
 storeEquipmentProfile({...profile,tasks:[...profile.tasks.filter(t=>t.id!==id),task]});
 // Keep unsaved equipment form fields while refreshing only the task list.
 $('equipmentTaskForm').reset();refreshEquipmentTaskList();notify('Maintenance task saved.');
}
function refreshEquipmentTaskList(){
 $('equipmentTaskList').innerHTML=equipmentProfile().tasks.map((t,i)=>'<div class="entry"><b>'+esc(t.name)+'</b><p>'+esc(equipmentTitle(t.equipmentType))+' · Every '+t.days+' day(s)</p><p>'+esc(t.description)+'</p><button class="secondary" type="button" onclick="editEquipmentTask('+i+')">Edit Task</button><button class="secondary" type="button" onclick="removeEquipmentTask('+i+')">Delete Task</button></div>').join('');
}
function removeEquipmentTask(i){
 const profile=equipmentProfile(),task=profile.tasks[i];if(!task||!confirm('Delete '+task.name+'? Earlier completion records will be retained.'))return;
 storeEquipmentProfile({...profile,tasks:profile.tasks.filter(t=>t.id!==task.id)});$('equipmentTaskForm').reset();refreshEquipmentTaskList();
}
function validateEquipmentBackup(data){
 const text=(v,max)=>typeof v==='string'&&v.length<=max;
 if(data?.version!==1||!Array.isArray(data.profiles)||data.profiles.length>1000)throw Error('Invalid equipment backup.');
 const seen=new Set();
 return data.profiles.map(p=>{
  if(!p||!text(p.poolId,200)||!p.poolId||seen.has(p.poolId)||!p.equipment||!p.links||!Array.isArray(p.tasks)||p.tasks.length>1000)throw Error('Invalid or duplicate equipment profile.');seen.add(p.poolId);
  const equipment={},links={};
  for(const type of EQUIPMENT_TYPES){const e=p.equipment[type];if(!e)continue;if(!['unknown','installed','absent'].includes(e.status)||!['brand','model','serial','notes'].every(k=>text(e[k],k==='notes'?1000:120)))throw Error('Invalid equipment details.');equipment[type]={status:e.status,brand:e.brand,model:e.model,serial:e.serial,notes:e.notes}}
  for(const [id,type] of Object.entries(p.links)){if(!/^[a-zA-Z0-9-]{1,100}$/.test(id)||!(type===''||EQUIPMENT_TYPES.includes(type)))throw Error('Invalid task link.');Object.defineProperty(links,id,{value:type,enumerable:true,writable:true,configurable:true})}
  const ids=new Set();const tasks=p.tasks.map(t=>{if(!t||!/^eq-[a-zA-Z0-9-]{1,80}$/.test(t.id)||ids.has(t.id)||!text(t.name,160)||!t.name.trim()||!text(t.description,1000)||!EQUIPMENT_TYPES.includes(t.equipmentType)||!Number.isInteger(t.days)||t.days<1||t.days>3650)throw Error('Invalid equipment task.');ids.add(t.id);return {id:t.id,name:t.name,description:t.description,equipmentType:t.equipmentType,days:t.days}});
  return {poolId:p.poolId,equipment,links,tasks};
 });
}
async function restoreEquipmentProfiles(event){
 try{const file=event.target.files[0];if(!file||file.size>5000000)throw Error('Choose an equipment backup below 5 MB.');const incoming=validateEquipmentBackup(JSON.parse(await file.text()));if(!confirm('Restore '+incoming.length+' equipment profile(s)? Matching profiles and equipment tasks will be replaced.'))return;
 const next=[...equipmentProfiles.filter(p=>!incoming.some(x=>x.poolId===p.poolId)),...incoming];persist(EQUIPMENT_KEY,next);equipmentProfiles=next;renderEquipmentProfile();notify('Equipment profiles restored.');
 }catch(error){notify(error.message)}finally{event.target.value=''}
}
const beforeEquipmentShow=show;show=function(id){beforeEquipmentShow(id);if(id==='equipmentProfile')renderEquipmentProfile()};
const beforeEquipmentRender=render;render=function(){beforeEquipmentRender();if(page==='equipmentProfile')renderEquipmentProfile()};
const beforeEquipmentAction=openMaintenanceTask;openMaintenanceTask=function(action){if(action==='equipment'){show('equipmentProfile');return}beforeEquipmentAction(action)};
for(const host of [homeActions||$('home'),$('manage')]){const button=document.createElement('button');button.className='secondary';button.textContent='Customer Equipment Profile — Selected Pool';button.onclick=()=>show('equipmentProfile');host.appendChild(button)}
trackerSection.firstElementChild.insertAdjacentHTML('beforeend','<button class="secondary" onclick="show(\'equipmentProfile\')">Equipment Profile & Task Links</button>');
