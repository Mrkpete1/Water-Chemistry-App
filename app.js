const P=[["XLR8",150],["200",500],["300",800],["350",1000],["ECO / EVO",440],["RISE",375],["THRIVE",250],["Plunge 14'",1500],['Plunge 7\'9"',800],["750",2800],["1200",3000],["2000",5000],["3500",5500]].map(([n,g])=>({id:"p"+n,n,g,p:1}));
let C=JSON.parse(localStorage.getItem("pools")||"[]"),sid=localStorage.getItem("sid")||"pRISE";
const den={ca:.471,bi:.626,acid:.745,soda:.547,spa:.65,hth:.66},soda=[0,.51,1.03,1.54,2.05,2.56],acid=[0,1.23,2.46,3.70,4.93,6.16];
const all=()=>[...P,...C],cur=()=>all().find(x=>x.id===sid)||P[5],f=(x,d=2)=>Number(x).toLocaleString(undefined,{maximumFractionDigits:d});
function save(){localStorage.setItem("pools",JSON.stringify(C));localStorage.setItem("sid",sid)}
function render(){pool.innerHTML=all().map(x=>`<option value="${x.id}" ${x.id==sid?"selected":""}>${x.n} — ${f(x.g)} gal</option>`).join("");pool.onchange=e=>{sid=e.target.value;save();render()};hdr.textContent=`${cur().n} • ${f(cur().g)} gallons`;plist.innerHTML=all().map(x=>`<p><b>${x.n}</b> — ${f(x.g)} gal ${x.p?"":`<button style="width:auto;padding:5px" onclick="del('${x.id}')">Delete</button>`}</p>`).join("")}
function addPool(){let n=pn.value.trim(),g=+pg.value;if(!n||g<=0)return alert("Enter a name and valid volume.");let id="c"+Date.now();C.push({id,n,g});sid=id;save();render();pn.value=pg.value="";show("home")}
function del(id){C=C.filter(x=>x.id!=id);if(sid==id)sid="pRISE";save();render()}
function show(id){["home","manage","fresh","routine","ref"].forEach(x=>document.getElementById(x).classList.toggle("hidden",x!=id));scrollTo(0,0)}
function wt(oz){if(oz>=16){let l=Math.floor(oz/16);return `${l} lb ${f(oz-l*16,1)} oz`}return `${f(oz)} oz`}
function vol(oz,d){let c=(oz/16)/d;if(c>=.5)return `≈ ${f(c)} cups`;let t=c*16;if(t>=1)return `≈ ${f(t,1)} tbsp`;return `≈ ${f(c*48,1)} tsp`}
function R(status,oz,product,density,msg){return{status,oz,product,density,msg}}
function ca(v,g){if(v>=200)return R("MINIMUM MET",null,"None",0,"No calcium increaser needed. Continue.");return R("LOW",((200-v)/10)*1.2*(g/10000)*16,"Calcium Chloride 77%",den.ca,"Add with circulation running. Allow to circulate, then RETEST calcium.")}
function ta(v,g){if(v<80)return R("LOW",((90-v)/10)*1.4*(g/10000)*16,"Sodium Bicarbonate",den.bi,"Raise toward 90 ppm. Add in portions, circulate 30–60 min, then RETEST.");if(v>120)return R("HIGH",.5*((v-110)/10)*2.15*(g/10000)*16,"Sodium Bisulfate (Dry Acid)",den.acid,"This is HALF the calculated correction. Circulate 30–60 min, then RETEST.");return R("IN RANGE",null,"None",0,"No adjustment. Continue.")}
function ph(v,g,d){if(v>=7.2&&v<=7.8)return R("IN RANGE",null,"None",0,"No adjustment. Continue.");let low=v<7.2;if(!d)return R(low?"LOW":"HIGH",null,low?"Soda Ash":"Dry Acid",low?den.soda:den.acid,`Run Taylor ${low?"BASE-demand (R-0006)":"ACID-demand (R-0005)"} test and enter 1–5 drops.`);return R(low?"LOW":"HIGH",.5*(low?soda[d]:acid[d])*(g/1000),low?"Soda Ash":"Dry Acid",low?den.soda:den.acid,"ADD NOW is half the Taylor-calculated dose. Circulate 30–60 min, then RETEST pH.")}
function br(v,g,p){if(v<3){let a=p=="SpaGuard"?.60:.62;return R("LOW",((4-v)*8.34*g/(a*1e6))*16,p=="SpaGuard"?"Brominating Granules – SpaGuard":"Granulated Bromine – HTH",p=="SpaGuard"?den.spa:den.hth,"Add granules in portions with circulation running, then RETEST.");}if(v>5)return R("HIGH",null,"None",0,"Do NOT add bromine or MPS. Allow level to fall; dilute only if needed.");return R("IN RANGE",null,"None",0,"No sanitizer adjustment needed.")}
function out(r){let ok=["IN RANGE","MINIMUM MET"].includes(r.status);return `<p class="${ok?"ok":"bad"}">${r.status}</p>${r.oz!=null?`<div class="muted">ADD NOW — BY WEIGHT</div><div class="dose">${wt(r.oz)}</div><b>${vol(r.oz,r.density)} by volume</b><p><b>${r.product}</b></p>`:""}<p>${r.msg}</p>${r.oz!=null?'<p class="muted">Weight preferred. Volume is approximate.</p>':""}`}
function card(i,t,target,extra=""){return `<div class="card"><h3>${i}. ${t}</h3><div class="muted">${target}</div><label>Your test result</label><input id="v${i}" inputmode="decimal" oninput="upd()">${extra}<div id="r${i}"></div></div>`}
function fresh(){show("fresh");steps.innerHTML=card(1,"Calcium Hardness","Minimum 200 ppm")+`<div id=s2 class=hidden>${card(2,"Total Alkalinity","80–120 ppm")}</div>`+`<div id=s3 class=hidden>${card(3,"pH","7.2–7.8",'<div id=demand class=hidden><label>Taylor demand drops</label><select id=drops onchange=upd()><option value=0>Select drops</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></div>')}</div>`+`<div id=s4 class=hidden>${card(4,"Bromine","3–5 ppm",'<label>Bromine product</label><select id=prod onchange=upd()><option>SpaGuard</option><option>HTH</option></select>')}</div>`}
function V(i){let e=document.getElementById("v"+i);return e&&e.value!==""?+e.value:null}
function upd(){let g=cur().g,c=V(1),t=V(2),p=V(3),b=V(4);if(c!=null)r1.innerHTML=out(ca(c,g));let cr=c!=null&&c>=200;s2.classList.toggle("hidden",!cr);if(t!=null)r2.innerHTML=out(ta(t,g));let tr=t!=null&&t>=80&&t<=120;s3.classList.toggle("hidden",!(cr&&tr));if(p!=null){demand.classList.toggle("hidden",p>=7.2&&p<=7.8);r3.innerHTML=out(ph(p,g,+drops.value))}let pr=p!=null&&p>=7.2&&p<=7.8;s4.classList.toggle("hidden",!(cr&&tr&&pr));if(b!=null)r4.innerHTML=out(br(b,g,prod.value))}
function routine(){show("routine");routineForm.innerHTML=`<label>Calcium</label><input id=rc inputmode=decimal><label>TA</label><input id=rt inputmode=decimal><label>pH</label><input id=rp inputmode=decimal><label>Taylor demand drops if needed</label><select id=rd><option value=0>Not needed / select</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select><label>Bromine</label><input id=rb inputmode=decimal><label>Bromine product</label><select id=rprod><option>SpaGuard</option><option>HTH</option></select><label>Notes</label><input id=rnote placeholder="Optional notes"><button onclick=calcRoutine()>Calculate</button><button class=secondary onclick=saveRoutine()>Save Test to History</button><div id=rr></div>`}
function calcRoutine(){let g=cur().g,a=[];if(rc.value)a.push(["Calcium",ca(+rc.value,g)]);if(rt.value)a.push(["Alkalinity",ta(+rt.value,g)]);if(rp.value)a.push(["pH",ph(+rp.value,g,+rd.value)]);if(rb.value)a.push(["Bromine",br(+rb.value,g,rprod.value)]);rr.innerHTML=a.map(([n,r])=>`<hr><h3>${n}</h3>${out(r)}`).join("")}
render();show("home");if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js");
// --- v2 field records, facilities, notes, timestamps ---
let HISTORY=JSON.parse(localStorage.getItem("chemHistory")||"[]");
function saveHistoryStore(){localStorage.setItem("chemHistory",JSON.stringify(HISTORY))}
function recordTest(mode, readings, results, note=""){
  HISTORY.unshift({id:Date.now(),date:new Date().toISOString(),mode,pool:cur().n,gallons:cur().g,readings,results,note});
  saveHistoryStore(); renderHistory();
}
function renderHistory(){
 let e=document.getElementById("historyList"); if(!e)return;
 if(!HISTORY.length){e.innerHTML='<p class="muted">No saved water tests yet.</p>';return}
 e.innerHTML=HISTORY.map(h=>`<div class="card"><b>${h.pool}</b> • ${h.gallons} gal<br><span class="muted">${new Date(h.date).toLocaleString()} • ${h.mode}</span><p>${Object.entries(h.readings).map(([k,v])=>`${k}: <b>${v}</b>`).join("<br>")}</p>${h.note?`<p>Notes: ${h.note}</p>`:""}<button class="secondary" onclick="deleteHistory(${h.id})">Delete record</button></div>`).join("")
}
function deleteHistory(id){HISTORY=HISTORY.filter(x=>x.id!==id);saveHistoryStore();renderHistory()}
function clearHistory(){if(confirm("Delete all locally saved test history?")){HISTORY=[];saveHistoryStore();renderHistory()}}
function exportHistory(){
 let rows=[["Date","Mode","Pool","Gallons","Calcium","TA","pH","Bromine","Notes"]];
 HISTORY.slice().reverse().forEach(h=>rows.push([h.date,h.mode,h.pool,h.gallons,h.readings.Calcium||"",h.readings.TA||"",h.readings.pH||"",h.readings.Bromine||"",h.note||""]));
 let csv=rows.map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(",")).join("\n");
 let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="water-chemistry-history.csv";a.click()
}
function addFacilityPool(){
 let fac=facilityName.value.trim(), n=facilityPool.value.trim(), g=+facilityGallons.value;
 if(!fac||!n||g<=0)return alert("Enter facility, pool name, and valid gallons.");
 let id="c"+Date.now();C.push({id,n:`${fac} — ${n}`,g,facility:fac});sid=id;save();render();renderFacilities();facilityName.value=facilityPool.value=facilityGallons.value=""
}
function renderFacilities(){
 let e=document.getElementById("facilityList");if(!e)return;
 let f=C.filter(x=>x.facility);
 e.innerHTML=f.length?f.map(x=>`<p><b>${x.facility}</b><br>${x.n.split(" — ").slice(1).join(" — ")} • ${fnum(x.g)} gal</p>`).join(""):'<p class="muted">No facility pools saved yet.</p>'
}
function fnum(x){return Number(x).toLocaleString()}
const originalShow=show; show=function(id){originalShow(id);if(id==="history")renderHistory();if(id==="facilities")renderFacilities()}

function saveRoutine(){
 let readings={};if(rc.value)readings.Calcium=rc.value;if(rt.value)readings.TA=rt.value;if(rp.value)readings.pH=rp.value;if(rb.value)readings.Bromine=rb.value;
 if(!Object.keys(readings).length)return alert("Enter at least one reading.");
 recordTest("Routine Test",readings,{},rnote.value||"");alert("Water test saved.")
}

// --- v3 daily/weekly operating logs matching supplied forms ---
let DAILY=JSON.parse(localStorage.getItem("dailyChemLog")||"[]");
let WEEKLY=JSON.parse(localStorage.getItem("weeklyChemLog")||"[]");
function localDT(){
 const d=new Date(), z=n=>String(n).padStart(2,"0");
 return {date:`${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`,time:`${z(d.getHours())}:${z(d.getMinutes())}`}
}
function renderDaily(){
 let d=localDT(); logForm.innerHTML=`<div class=card><h3>Daily Water Chemistry Log</h3><p class=muted>Bromine, pH and temperature — matching the supplied daily log.</p>
 <div class=logrow><div><label>Date</label><input id=ldate type=date value="${d.date}"></div><div><label>Time</label><input id=ltime type=time value="${d.time}"></div></div>
 <label>Bromine (ppm)</label><input id=lb inputmode=decimal><label>pH</label><input id=lph inputmode=decimal><label>Temperature (°F)</label><input id=ltemp inputmode=decimal>
 <label>Initials</label><input id=linit maxlength=8><label>Notes</label><textarea id=lnotes rows=3></textarea><button onclick=saveDaily()>Save Daily Reading</button></div>`;
 renderDailyEntries()
}
function saveDaily(){
 if(!lb.value&&!lph.value&&!ltemp.value)return alert("Enter at least one chemistry reading.");
 DAILY.unshift({id:Date.now(),pool:cur().n,gallons:cur().g,date:ldate.value,time:ltime.value,bromine:lb.value,pH:lph.value,temp:ltemp.value,initials:linit.value,notes:lnotes.value});
 localStorage.setItem("dailyChemLog",JSON.stringify(DAILY));renderDaily();alert("Daily reading saved.")
}
function renderDailyEntries(){
 logEntries.innerHTML=`<div class=card><h3>Recent Daily Readings</h3>${DAILY.length?DAILY.slice(0,30).map(x=>`<div class=entry><b>${x.date} ${x.time}</b> • ${x.pool}<br>Bromine: <b>${x.bromine||"—"}</b> | pH: <b>${x.pH||"—"}</b> | Temp: <b>${x.temp||"—"}°F</b><br>${x.initials?`Initials: ${x.initials}<br>`:""}${x.notes||""}</div>`).join(""):'<p class=muted>No daily readings saved.</p>'}<button class=secondary onclick="exportLog('daily')">Export Daily CSV</button></div>`
}
function renderWeekly(){
 let d=localDT(); logForm.innerHTML=`<div class=card><h3>Weekly Water Chemistry Log</h3><p class=muted>Total alkalinity and calcium hardness — matching the supplied weekly log.</p>
 <div class=logrow><div><label>Date</label><input id=wdate type=date value="${d.date}"></div><div><label>Time</label><input id=wtime type=time value="${d.time}"></div></div>
 <label>Total Alkalinity (ppm)</label><input id=wta inputmode=decimal><label>Calcium Hardness (ppm)</label><input id=wca inputmode=decimal>
 <label>Initials</label><input id=winit maxlength=8><label>Notes</label><textarea id=wnotes rows=3></textarea><button onclick=saveWeekly()>Save Weekly Reading</button></div>`;
 renderWeeklyEntries()
}
function saveWeekly(){
 if(!wta.value&&!wca.value)return alert("Enter alkalinity and/or calcium hardness.");
 WEEKLY.unshift({id:Date.now(),pool:cur().n,gallons:cur().g,date:wdate.value,time:wtime.value,ta:wta.value,calcium:wca.value,initials:winit.value,notes:wnotes.value});
 localStorage.setItem("weeklyChemLog",JSON.stringify(WEEKLY));renderWeekly();alert("Weekly reading saved.")
}
function renderWeeklyEntries(){
 logEntries.innerHTML=`<div class=card><h3>Recent Weekly Readings</h3>${WEEKLY.length?WEEKLY.slice(0,30).map(x=>`<div class=entry><b>${x.date} ${x.time}</b> • ${x.pool}<br>TA: <b>${x.ta||"—"}</b> | Calcium: <b>${x.calcium||"—"}</b><br>${x.initials?`Initials: ${x.initials}<br>`:""}${x.notes||""}</div>`).join(""):'<p class=muted>No weekly readings saved.</p>'}<button class=secondary onclick="exportLog('weekly')">Export Weekly CSV</button></div>`
}
function exportLog(type){
 let data=type==="daily"?DAILY:WEEKLY;
 let head=type==="daily"?["Date","Time","Pool","Gallons","Bromine","pH","Temperature","Initials","Notes"]:["Date","Time","Pool","Gallons","Alkalinity","Calcium Hardness","Initials","Notes"];
 let rows=[head];
 data.slice().reverse().forEach(x=>rows.push(type==="daily"?[x.date,x.time,x.pool,x.gallons,x.bromine,x.pH,x.temp,x.initials,x.notes]:[x.date,x.time,x.pool,x.gallons,x.ta,x.calcium,x.initials,x.notes]));
 let csv=rows.map(r=>r.map(v=>`"${String(v||"").replaceAll('"','""')}"`).join(",")).join("\n");
 let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`${type}-water-chemistry-log.csv`;a.click()
}
const showV3=show;show=function(id){showV3(id);if(id==="logs")renderDaily()}

// --- v4 contextual training videos + log status ---
const TEST_VIDEOS={
  1:{title:"How to Test Calcium Hardness",src:"videos/Calcium.mp4"},
  2:{title:"How to Test Total Alkalinity",src:"videos/Alkalinity.mp4"},
  3:{title:"How to Test pH",src:"videos/PH.mp4"},
  4:{title:"How to Test Bromine",src:"videos/Bromine.mp4"}
};
function openVideo(step){
 let v=TEST_VIDEOS[step]; if(!v)return;
 videoTitle.textContent=v.title; helpVideo.src=v.src; videoModal.classList.remove("hidden"); helpVideo.play().catch(()=>{});
}
function closeVideo(e){
 if(e && e.target!==videoModal)return;
 helpVideo.pause(); helpVideo.removeAttribute("src"); helpVideo.load(); videoModal.classList.add("hidden");
}
card=function(i,t,target,extra=""){
 return `<div class="card"><h3>${i}. ${t}</h3><div class="muted">${target}</div>
 <button class="helpbtn" onclick="openVideo(${i})">▶ ${TEST_VIDEOS[i].title}</button>
 <label>Your test result</label><input id="v${i}" inputmode="decimal" oninput="upd()">${extra}<div id="r${i}"></div></div>`
}
function dailyStatus(){
 let last=DAILY[0]; if(!last)return "No daily reading recorded yet.";
 return `Last daily reading: ${last.date} ${last.time} — ${last.pool}`;
}
function weeklyStatus(){
 let last=WEEKLY[0]; if(!last)return "No weekly reading recorded yet.";
 return `Last weekly reading: ${last.date} ${last.time} — ${last.pool}`;
}
const renderDailyV4=renderDaily;
renderDaily=function(){
 renderDailyV4();
 logForm.insertAdjacentHTML("afterbegin",`<div class="statusline">${dailyStatus()}</div>
 <button class="helpbtn" onclick="openVideo(4)">▶ How to Test Bromine</button>
 <button class="helpbtn" onclick="openVideo(3)">▶ How to Test pH</button>`);
}
const renderWeeklyV4=renderWeekly;
renderWeekly=function(){
 renderWeeklyV4();
 logForm.insertAdjacentHTML("afterbegin",`<div class="statusline">${weeklyStatus()}</div>
 <button class="helpbtn" onclick="openVideo(2)">▶ How to Test Total Alkalinity</button>
 <button class="helpbtn" onclick="openVideo(1)">▶ How to Test Calcium Hardness</button>`);
}
