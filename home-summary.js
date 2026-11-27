// Read-only summary. Existing record formats and save paths are unchanged.
const homeSummary=document.createElement('div');
homeSummary.id='homeMaintenanceSummary';homeSummary.className='card';
$('pool').closest('.card').after(homeSummary);
function summaryCompletion(task){
 const dates=maintenanceRecords.filter(r=>r.poolId===cur()?.id&&r.task===task.id).map(r=>r.date);
 const source=task.id==='daily-water'?DAILY:task.id==='weekly-water'?WEEKLY:task.id==='weekly-shock'?HISTORY.filter(r=>r.mode==='Weekly / As-needed Shock'):[];
 dates.push(...source.filter(r=>r.poolId===cur()?.id).map(r=>{if(!String(r.date).includes('T'))return String(r.date);const d=new Date(r.date);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}));
 return dates.filter(date=>validMaintenanceDate(date)).sort().at(-1)||null;
}
function homeMaintenanceItems(){
 const today=maintenanceToday(),due=[],attention=[],unrecorded=[];
 for(const task of maintenanceTasks()){
  if(task.afterUse)continue; // No usage event is available to calculate an after-use due date.
  const item={id:task.id,name:task.name,action:task.action};
  const last=latestMaintenance(task.id);
  if(task.id===BELT_CHECK_ID&&last?.beltResult&&last.beltResult!=='both'){
   attention.push({...item,reason:'Call HydroWorx — '+(BELT_RESULTS[last.beltResult]||'review the last belt finding')+'. Recorded '+last.date+'.'});continue;
  }
  const completed=summaryCompletion(task);
  if(!completed){unrecorded.push({...item,reason:'No completion recorded. Review the checklist to establish the next due date.'});continue;}
  const date=addMaintenanceInterval(completed,task.days||0,task.months||0);
  if(date<today)attention.push({...item,reason:'Overdue since '+date+'. Last recorded '+completed+'.'});
  else if(date===today)due.push({...item,reason:'Due today · last recorded '+completed+'.'});
 }
 const pressure=filterReadings.filter(r=>r.poolId===cur()?.id).slice().sort((a,b)=>b.date.localeCompare(a.date)||String(b.recorded).localeCompare(String(a.recorded)))[0];
 if(pressure&&pressure.current-pressure.baseline>=pressure.threshold)attention.unshift({id:'filter-pressure',name:'Filter pressure reached its cleaning reminder',action:'filter',reason:f(pressure.current-pressure.baseline)+' PSI above the recorded clean-filter baseline (reminder: '+f(pressure.threshold)+' PSI). Reading dated '+pressure.date+'. Review the filter instructions and record a fresh reading after service.'});
 return {due,attention,unrecorded};
}
function renderHomeMaintenanceSummary(){
 const pool=cur();homeSummary.dataset.date=maintenanceToday();
 if(!pool){homeSummary.innerHTML='<h3>Due Today & Needs Attention</h3><p>Select a pool above to see its reminders.</p>';return;}
 const {due,attention,unrecorded}=homeMaintenanceItems();
 const row=item=>'<div class="entry" data-summary-task="'+esc(item.id)+'"><b>'+esc(item.name)+'</b><p>'+esc(item.reason)+'</p><button type="button" data-summary-open="'+esc(item.id)+'">'+(item.id==='daily-water'?'Open Daily Tests':item.id==='weekly-water'?'Open Weekly Tests':item.id==='weekly-shock'?'Open Shock Workflow':item.id==='filter-pressure'?'Open Filter Pressure Tracker':'Open Checklist')+'</button><button type="button" class="secondary" data-summary-instructions="'+esc(item.action)+'">View Instructions</button></div>';
 homeSummary.innerHTML='<h3>Today for '+esc(pool.n)+'</h3><p class="muted">'+maintenanceToday()+' · Selected pool only</p><section aria-labelledby="homeAttentionTitle"><h4 id="homeAttentionTitle">Needs Attention ('+attention.length+')</h4>'+(attention.length?attention.map(row).join(''):'<p>No overdue tasks or flagged belt/pressure findings in the available records.</p>')+'</section><section aria-labelledby="homeDueTitle"><h4 id="homeDueTitle">Due Today ('+due.length+')</h4>'+(due.length?due.map(row).join(''):'<p>No scheduled tasks due today in the available records.</p>')+'</section>'+(unrecorded.length?'<details><summary>Not Yet Recorded ('+unrecorded.length+')</summary><p>These tasks have no recorded completion; their due dates are unknown.</p>'+unrecorded.map(row).join('')+'</details>':'')+'<p class="muted">After-use tasks still apply after each use. Maintenance, belt and pressure reminders use records in this browser. Daily/weekly water logs and weekly shock history also count toward their reminders; in shared mode, these use the loaded shared records. This summary does not certify that a pool is ready for use.</p><button type="button" class="secondary" data-summary-open="all">Open Full Maintenance Checklist</button>';
}
homeSummary.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(window.waterAppUpdates?.hasUnsaved()){notify('Save or finish your open entries before opening another form.');return;}
 if(button.dataset.summaryInstructions){openMaintenanceTask(button.dataset.summaryInstructions);return;}
 const id=button.dataset.summaryOpen;
 if(id==='daily-water'||id==='weekly-water'){openQuickTest(id==='daily-water'?'daily':'weekly');return;}
 if(id==='weekly-shock'){openShock('weekly');return;}
 show('maintenanceTracker');
 const target=id==='filter-pressure'?$('filterCurrent'):id==='all'?$('trackerBody'):[...$('maintenanceTaskGroups').querySelectorAll('.entry')].find(el=>el.dataset.maintenanceTask===id);
 target?.scrollIntoView({behavior:'smooth',block:'center'});
});
const showBeforeHomeSummary=show;
show=function(id){showBeforeHomeSummary(id);if(id==='home')renderHomeMaintenanceSummary();};
const renderBeforeHomeSummary=render;
render=function(){renderBeforeHomeSummary();renderHomeMaintenanceSummary();};
const historyBeforeHomeSummary=replaceFacilityHistory;
replaceFacilityHistory=function(records){historyBeforeHomeSummary(records);if(page==='home')renderHomeMaintenanceSummary();};
// Refresh only this read-only card; never rebuild an open entry form on a timer.
setInterval(()=>{if(page==='home'&&!document.hidden&&homeSummary.dataset.date!==maintenanceToday())renderHomeMaintenanceSummary();},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&page==='home')renderHomeMaintenanceSummary();});
renderHomeMaintenanceSummary();
