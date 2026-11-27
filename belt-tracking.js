// Visual check wording supplied by the app owner. No adjustment procedure is inferred.
const BELT_CHECK_ID='daily-belt-tracking';
const BELT_RESULTS={both:'Belt visible in both windows',one:'Belt visible in one window only — adjustment needed',unclear:'Unable to confirm belt position — guidance needed'};
const beltInstructions='<p>Check both belt-tracking windows regularly. This checklist uses a daily visual reminder for treadmills equipped with tracking windows.</p><ul><li><b>Tracking looks acceptable:</b> some belt is visible in each window. The amount visible does not have to be identical.</li><li><b>Adjustment needed:</b> the belt is all the way into one window and no belt is visible in the other. The side it is favoring—the side where you can see the belt—is the side that needs adjustment.</li></ul><p><b>Call HydroWorx for adjustment instructions.</b> This app does not provide bolt-turning or tension-adjustment steps. If you cannot clearly see the belt position, contact HydroWorx for guidance.</p><p><a href="tel:+18007539633">Call HydroWorx: 800-753-9633</a> · <a href="https://www.hydroworx.com/research-education/support/service/" target="_blank" rel="noopener">HydroWorx Service & Support</a></p>';
const beltSection=document.createElement('section');beltSection.id='beltTracking';beltSection.className='hidden';
beltSection.innerHTML='<div class="card"><h2>Check Treadmill Belt Tracking</h2><p>For treadmills equipped with belt-tracking windows.</p>'+beltInstructions+'<button class="secondary" onclick="show(\'maintenanceTracker\')">Record a Belt Check</button></div>';
document.querySelector('main').insertBefore(beltSection,$('appVersion'));
const beltTasksBefore=maintenanceTasks;
maintenanceTasks=function(){const tasks=beltTasksBefore();if(cleaningEquipment().beltTracking!==false)tasks.push({id:BELT_CHECK_ID,name:'Check treadmill belt tracking (if equipped)',group:'Daily',days:1,action:'beltTracking',description:'Look at both tracking windows. Some belt in each window is acceptable. Belt in only one window needs adjustment on the side where the belt is visible; call HydroWorx for instructions.'});return tasks;};
const beltGroupsBefore=renderMaintenanceTaskGroups;
renderMaintenanceTaskGroups=function(tasks){
 let html=beltGroupsBefore(tasks);
 const button='<button onclick="completeMaintenanceTask(\''+BELT_CHECK_ID+'\')">Mark Complete</button>';
 return html.replace(button,'<label for="beltTrackingResult">What did you see?</label><select id="beltTrackingResult"><option value="">Select a result</option>'+Object.entries(BELT_RESULTS).map(([value,label])=>'<option value="'+value+'">'+esc(label)+'</option>').join('')+'</select><p class="muted">Use the completion date, initials and service notes above. Recording a check does not mean an adjustment has been completed.</p><button onclick="completeMaintenanceTask(\''+BELT_CHECK_ID+'\')">Record Belt Check</button>');
};
const beltRenderBefore=renderMaintenanceTracker;
renderMaintenanceTracker=function(){
 beltRenderBefore();if(!cur())return;
 const trainer=$('cleaningHasTrainer');
 trainer.closest('label').insertAdjacentHTML('afterend','<label class="check"><input type="checkbox" id="cleaningHasBeltTracking" '+(cleaningEquipment().beltTracking!==false?'checked':'')+' onchange="saveCleaningEquipment()">Treadmill with belt-tracking windows</label>');
};
const beltStatusBefore=taskStatus;
taskStatus=function(task){const last=latestMaintenance(task.id);if(task.id===BELT_CHECK_ID&&last?.beltResult&&last.beltResult!=='both')return {text:'Needs attention — call HydroWorx. Last finding: '+BELT_RESULTS[last.beltResult],due:null};return beltStatusBefore(task);};
const beltCompleteBefore=completeMaintenanceTask;
completeMaintenanceTask=function(id){
 if(id!==BELT_CHECK_ID)return beltCompleteBefore(id);
 const pool=cur();if(!pool||cleaningEquipment().beltTracking===false)return;
 const result=$('beltTrackingResult')?.value,date=$('maintenanceDate').value,initials=$('maintenanceInitials').value.trim();
 if(!Object.hasOwn(BELT_RESULTS,result))return notify('Select what you saw in the tracking windows.');
 if(!validMaintenanceDate(date)||!initials)return notify('Enter a valid check date and your initials.');
 const row={id:uid(),poolId:pool.id,pool:pool.n,task:id,label:'Belt tracking: '+BELT_RESULTS[result],date,initials,note:$('maintenanceNote').value,beltResult:result,recorded:new Date().toISOString()};
 const next=[...maintenanceRecords,row];persist('poolMaintenanceV547',next);maintenanceRecords=next;
 $('maintenanceTaskGroups').innerHTML=renderMaintenanceTaskGroups(maintenanceTasks());
 window.waterAppUpdates?.markSaved('#maintenanceDate,#maintenanceInitials,#maintenanceNote');
 renderMaintenanceRecent();
 notify(result==='both'?'Belt check saved.':'Belt check saved — call HydroWorx for instructions.');
};
const beltActionBefore=openMaintenanceTask;
openMaintenanceTask=function(action){if(action==='beltTracking'){show('beltTracking');return;}beltActionBefore(action);};
cleaningSchedule.querySelectorAll('.card').forEach(card=>{
 if(card.querySelector('h3')?.textContent==='Daily')card.querySelector('ul').insertAdjacentHTML('beforeend','<li>Check the treadmill belt-tracking windows, if equipped. Some belt should be visible in each window. If it is visible in only one, call HydroWorx for adjustment instructions.</li>');
});
cleaningSchedule.insertAdjacentHTML('beforeend','<div class="card"><h3>Treadmill Belt Tracking — If Equipped</h3>'+beltInstructions+'<button class="secondary" onclick="show(\'maintenanceTracker\')">Open Checklist & Record Belt Check</button></div>');
