const DEFAULT_P=PRESET_CATALOG.map(p=>({...p}));
let P=localStorage.getItem('standardPoolsV52')===null?DEFAULT_P.map(x=>({...x})):readStore('standardPoolsV52');
let C=readStore("pools").map(x=>({...x,n:String(x.n).toUpperCase(),facility:String(x.facility||'').toUpperCase()})),sid=localStorage.getItem("sid")||"";
if(!localStorage.getItem('blankPoolV533')){sid='';localStorage.removeItem('sid');localStorage.setItem('blankPoolV533','1')}
P.forEach(x=>x.n=x.n.toUpperCase());
const den={ca:.471,bi:.626,acid:.745,soda:.547,spa:.65,hth:.66},soda=[0,.51,1.03,1.54,2.05,2.56],acid=[0,1.23,2.46,3.70,4.93,6.16];
const all=()=>sortedPools([...P,...C]),cur=()=>sid?all().find(x=>x.id===sid)||null:null,f=(x,d=2)=>Number(x).toLocaleString(undefined,{maximumFractionDigits:d});
function doseNumber(n){return f(Math.floor((n+1e-10)*1000)/1000,3)}
function wt(oz){if(oz>0&&oz<.001)return '<0.001 oz — use a suitable precision scale';if(oz>=16){let l=Math.floor(oz/16);return `${l} lb ${doseNumber(oz-l*16)} oz`}return `${doseNumber(oz)} oz`}
function vol(oz,d){let c=(oz/16)/d;if(c>=.5)return `≈ ${doseNumber(c)} cups`;let t=c*16;if(t>=1)return `≈ ${doseNumber(t)} tbsp`;return `≈ ${doseNumber(c*48)} tsp`}
function R(status,oz,product,density,msg){return{status,oz,product,density,msg}}
function calciumTarget(){
 const pool=cur();
 let setup=null;try{setup=JSON.parse(localStorage.getItem('customerSetupV535')||'null')}catch(e){}
 const source=setup?.pools?.find(p=>setup.poolIds?.[keyPool(p)]===pool?.id);
 const model=source?.n || PRESET_CATALOG.find(p=>p.id===pool?.id)?.n || pool?.n || '';
 return /^(THRIVE|XLR8)$/i.test(model)?{min:250,max:350}:{min:200,max:400};
}
function calciumRange(){const t=calciumTarget();return `Ideal range ${t.min}–${t.max} ppm`}
function ca(v,g){const t=calciumTarget();if(v>t.max)return R("HIGH",null,"None",0,`${calciumRange()}. Do not add calcium increaser. Review source water and the pool manual before correcting high hardness; retest.`);if(v>=t.min)return R("IN RANGE",null,"None",0,`${calciumRange()}. No calcium increaser needed. Continue.`);return R("LOW",((t.min-v)/10)*1.2*(g/10000)*16,"Calcium Chloride 77%",den.ca,`${calciumRange()}. Raise toward ${t.min} ppm with circulation running, then RETEST calcium.`)}
function ta(v,g){if(v<80)return R("LOW",((90-v)/10)*1.4*(g/10000)*16,"Sodium Bicarbonate",den.bi,"Raise toward 90 ppm. Add in portions, circulate 30–60 min, then RETEST.");if(v>120)return R("HIGH",.5*((v-110)/10)*2.15*(g/10000)*16,"Sodium Bisulfate (Dry Acid)",den.acid,"This is HALF the calculated correction. Retest before calculating another dose.");return R("IN RANGE",null,"None",0,"No adjustment. Continue.")}
function ph(v,g,d){if(v>=7.2&&v<=7.8)return R("IN RANGE",null,"None",0,"No adjustment. Continue.");let low=v<7.2;if(!d)return R(low?"LOW":"HIGH",null,low?"Soda Ash":"Dry Acid",low?den.soda:den.acid,`Run Taylor ${low?"BASE-demand (R-0006)":"ACID-demand (R-0005)"} test and enter 1–5 drops.`);return R(low?"LOW":"HIGH",.5*(low?soda[d]:acid[d])*(g/1000),low?"Soda Ash":"Dry Acid",low?den.soda:den.acid,"ADD NOW is half the Taylor-calculated dose. Retest pH before another dose.")}
function br(v,g,p){if(v<3){let a=p=="SpaGuard"?.60:.62;return R("LOW",((4-v)*8.34*g/(a*1e6))*16,p=="SpaGuard"?"Brominating Granules – SpaGuard":"Granulated Bromine – HTH",p=="SpaGuard"?den.spa:den.hth,"Add granules in portions with circulation running, then RETEST.");}if(v>5)return R("HIGH",null,"None",0,"Do NOT add bromine or MPS. Allow level to fall; dilute only if needed.");return R("IN RANGE",null,"None",0,"No sanitizer adjustment needed.")}
