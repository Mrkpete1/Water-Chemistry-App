// Carrier/Langelier approximation. CH and TA are ppm as CaCO3; TDS is ppm.
// Sources and approximation limits are documented in LSI-CALCULATOR.txt.
function lsiCategory(value){return value < -.3-1e-10?'low':value > .3+1e-10?'high':'balanced'}
function calculateLSI({ph,temp,unit='F',ta,calcium,tds,cya}){
 for(const value of [ph,temp,ta,calcium,tds,cya])if(typeof value!=='number'||!Number.isFinite(value))throw Error('Enter a measured number in every field, including CYA (0 if confirmed absent).');
 if(!['F','C'].includes(unit))throw Error('Choose Fahrenheit or Celsius.');
 const celsius=unit==='F'?(temp-32)*5/9:temp;
 if(celsius<0||celsius>50)throw Error('Enter a water temperature from 32–122°F (0–50°C).');
 if(ph<=0||ph>14)throw Error('Enter a pH greater than 0 and no higher than 14.');
 if(ta<=0||ta>1000||calcium<=0||calcium>2000)throw Error('Enter TA from above 0 to 1,000 ppm and calcium hardness from above 0 to 2,000 ppm.');
 if(tds<=0||tds>10000)throw Error('Enter measured TDS above 0 and no higher than 10,000 ppm.');
 if(cya<0||cya>300)throw Error('Enter CYA from 0 to 300 ppm.');
 const adjustedTA=ta-cya/3;
 if(adjustedTA<=0)throw Error('CYA-corrected alkalinity must be above zero. Verify the TA and CYA tests before using LSI.');
 const A=(Math.log10(tds)-1)/10;
 const B=-13.12*Math.log10(celsius+273.15)+34.55;
 const C=Math.log10(calcium)-.4,D=Math.log10(adjustedTA);
 const saturationPH=9.3+A+B-C-D,lsi=ph-saturationPH;
 return {lsi,saturationPH,adjustedTA,celsius,category:lsiCategory(lsi)};
}
const lsiSection=document.createElement('section');lsiSection.id='lsi';lsiSection.className='hidden';
lsiSection.innerHTML=`<div class="card"><h2>LSI Calculator</h2><p id="lsiPool"></p><p>LSI (Langelier Saturation Index) estimates whether water tends to dissolve calcium carbonate or leave calcium scale. It combines pH, temperature, alkalinity, calcium hardness and dissolved solids.</p><details><summary>When would I use this?</summary><ul><li>After a fresh fill, once chemistry has been balanced and retested.</li><li>As an extra check during weekly water testing.</li><li>After a large temperature change, major refill or significant chemistry change.</li><li>When investigating recurring scale or calcium deposits.</li></ul><p>Use current measurements taken under the same operating conditions. LSI helps investigate water balance; it does not identify every cause of stains, cloudy water or equipment damage.</p></details><p><b>LSI does not measure sanitation.</b> Continue bromine testing and keep each chemistry reading within the app’s recommended range. An acceptable LSI alone does not mean the pool is ready for use.</p></div>
<div class="card"><h3>Enter Current Readings</h3><button type="button" class="secondary" id="lsiLoad">Load Selected Pool’s Latest Readings</button><p id="lsiLoaded" class="muted" style="white-space:pre-wrap"></p>
<form id="lsiForm" novalidate><label for="lsiPH">pH</label><input id="lsiPH" type="number" inputmode="decimal" step="any" min="0.01" max="14">
<label for="lsiTemp">Water temperature</label><div class="logrow"><input aria-label="Water temperature" id="lsiTemp" type="number" inputmode="decimal" step="any"><select id="lsiUnit" aria-label="Temperature unit"><option value="F">°F — Fahrenheit</option><option value="C">°C — Celsius</option></select></div>
<label for="lsiTA">Total alkalinity (ppm as CaCO₃)</label><input id="lsiTA" type="number" inputmode="decimal" step="any">
<label for="lsiCalcium">Calcium hardness (ppm as CaCO₃)</label><input id="lsiCalcium" type="number" inputmode="decimal" step="any">
<label for="lsiTDS">Total dissolved solids — TDS (ppm)</label><input id="lsiTDS" type="number" inputmode="decimal" step="any"><p class="muted">Use a measured TDS value from a suitable meter or water test. If unknown, have it tested; do not guess.</p>
<label for="lsiCYA">Cyanuric acid — CYA / stabilizer (ppm)</label><input id="lsiCYA" type="number" inputmode="decimal" step="any" min="0"><p class="muted">Enter 0 only if confirmed absent. Dichlor shock can add CYA, even in a bromine pool.</p><button type="submit">Calculate LSI</button></form><div id="lsiResult" role="status" aria-live="polite"></div></div>
<div class="card"><h3>What Does the Number Mean?</h3><ul><li><b>Below −0.3:</b> water tends to dissolve calcium carbonate. Review low pH, alkalinity or calcium readings.</li><li><b>−0.3 to +0.3:</b> commonly accepted balance range for pool water.</li><li><b>Above +0.3:</b> calcium scale is more likely. Review high pH, alkalinity, calcium and temperature.</li></ul><p>For acrylic and fabricated pools, LSI still helps assess calcium scale on equipment; it is not a test of the pool shell. It does not directly predict metal corrosion or prove that equipment is protected.</p><p>Confirm unexpected readings. Use Routine Water Test for corrections based on individual results. Make one adjustment at a time, follow the product directions, then <b>RUN JETS 15 MINUTES → WAIT 30 MINUTES → RETEST</b> before recalculating.</p><button type="button" class="secondary" id="lsiRoutine">Open Routine Water Test</button>
<details><summary>Calculation & limitations</summary><p>This is an approximate LSI calculation using measured TDS and temperature. Carbonate alkalinity is estimated as total alkalinity minus one-third of CYA. This correction is approximate and does not account for borates or other alkalinity contributors. For unusual chemistry, high stabilizer or borate-treated water, request a full water analysis.</p><p>Small changes near −0.3 or +0.3 can reflect test uncertainty. Judge trends and individual measurements, rather than adjusting chemicals solely to change this number.</p><p><a href="https://www.lenntech.nl/langelier-index.htm" target="_blank" rel="noopener noreferrer">Lenntech — LSI formula</a> · <a href="https://www.pentair.com/content/dam/extranet/nam/pentair-pool/residential/sanitizers/intellichlor-plus-lt/user-documents/intellichlor-ltplus-manual-en-fr-523854.pdf#page=10" target="_blank" rel="noopener noreferrer">Pentair — pool interpretation and CYA correction</a></p></details></div><button type="button" class="secondary" onclick="show('home')">Back to Home</button>`;
document.querySelector('main').appendChild(lsiSection);
function lsiButton(){const b=document.createElement('button');b.className='secondary';b.textContent='LSI Calculator';b.onclick=()=>show('lsi');return b}
(homeActions||$('home')).appendChild(lsiButton());
const lsiReference=document.createElement('div');lsiReference.className='card';lsiReference.appendChild(lsiButton());$('ref').appendChild(lsiReference);
const lsiFields=['lsiPH','lsiTemp','lsiTA','lsiCalcium','lsiTDS','lsiCYA'];let lsiPoolContext;
function clearLSIResult(){$('lsiResult').replaceChildren()}
function resetLSI(){lsiFields.forEach(id=>$(id).value='');$('lsiUnit').value='F';$('lsiLoaded').textContent='';clearLSIResult()}
function syncLSIPool(){const pool=cur(),id=pool?.id||'';if(lsiPoolContext!==id){lsiPoolContext=id;resetLSI()}$('lsiPool').textContent=pool?pool.n+' — '+f(pool.g)+' GAL':'Manual calculation — no pool selected';$('lsiLoad').disabled=!pool}
function loadLSIReadings(){
 syncLSIPool();resetLSI();const pool=cur();if(!pool){$('lsiLoaded').textContent='Select a pool to load its saved readings, or enter measurements manually.';return}
 const saved=records().filter(r=>r.poolId===pool.id);
 const definitions=[['lsiPH','pH'],['lsiTemp','Temperature'],['lsiTA','TA'],['lsiCalcium','Calcium']];const loaded=[];
 for(const [id,key]of definitions){const record=saved.find(r=>{const v=r.readings?.[key];return v!==undefined&&v!==null&&String(v).trim()!==''&&Number.isFinite(Number(v))});if(record){$(id).value=Number(record.readings[key]);loaded.push((key==='Temperature'?'Temperature (°F)':key)+': '+record.date+(record.time?' '+record.time:''))}}
 $('lsiLoaded').textContent=loaded.length?'Loaded saved readings:\n'+loaded.join('\n')+'\nThese may be from different dates. Confirm or replace with current measurements. Enter measured TDS and CYA.':'No saved readings for this pool. Enter current measurements, including TDS and CYA.';
}
$('lsiLoad').onclick=loadLSIReadings;
lsiFields.forEach(id=>$(id).addEventListener('input',clearLSIResult));
$('lsiUnit').dataset.previous='F';$('lsiUnit').onchange=()=>{const field=$('lsiTemp');if(field.value.trim()!==''&&Number.isFinite(Number(field.value))){const n=Number(field.value);field.value=Number(($('lsiUnit').value==='C'?(n-32)*5/9:n*9/5+32).toFixed(4))}clearLSIResult()};
$('lsiForm').onsubmit=e=>{e.preventDefault();clearLSIResult();try{
 const number=id=>$(id).value.trim()===''?NaN:Number($(id).value);
 const inputs={ph:number('lsiPH'),temp:number('lsiTemp'),unit:$('lsiUnit').value,ta:number('lsiTA'),calcium:number('lsiCalcium'),tds:number('lsiTDS'),cya:number('lsiCYA')};const result=calculateLSI(inputs);
 const title={low:'LOW — CALCIUM-DISSOLVING TENDENCY',balanced:'WITHIN THE LSI BALANCE RANGE',high:'HIGH — SCALE-FORMING TENDENCY'}[result.category];
 const next={low:'Check pH, TA and calcium against their individual targets. Confirm low readings before making a correction.',balanced:'Continue routine testing. Confirm that the individual chemistry readings and bromine are also in range.',high:'Check for high pH, TA or calcium. Confirm readings before correcting; do not add calcium solely to change LSI.'}[result.category];
 const display=Math.abs(result.lsi)<.0005?'0.000':(result.lsi>0?'+':'')+result.lsi.toFixed(3);
 $('lsiResult').innerHTML='<div class="statusline"><p class="dose">LSI '+display+'</p><p class="'+(result.category==='balanced'?'ok':'bad')+'">'+title+'</p><p>'+next+'</p><p>CYA-corrected alkalinity: '+f(result.adjustedTA,1)+' ppm</p><p class="muted">Classification uses the unrounded result. Target: −0.3 to +0.3.</p>'+((inputs.ph<6.5||inputs.ph>8.5||inputs.cya>100)?'<p class="warning">These measurements are outside typical conditions for this approximation. Verify the tests and request a full water analysis.</p>':'')+'</div>';
 }catch(error){$('lsiResult').innerHTML='<p class="bad">'+esc(error.message)+'</p>'}};
$('lsiRoutine').onclick=()=>{if(!cur())return notify('Select a pool on Home before opening Routine Water Test.');routine()};
const showBeforeLSI=show;show=function(id){showBeforeLSI(id);if(id==='lsi')loadLSIReadings()};
const renderBeforeLSI=render;render=function(){renderBeforeLSI();syncLSIPool()};syncLSIPool();
