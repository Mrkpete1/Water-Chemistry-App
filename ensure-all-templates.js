if(!localStorage.getItem('customerSetupV535')&&!localStorage.getItem('allTemplatesEnsuredV543')){
// Ensure every owner-approved catalog entry is available as a protected template.
// Existing edits are retained by stable ID; missing entries are restored once.
const current=Array.isArray(P)?P:[];
const merged=current.map(p=>({...p}));
for(const catalog of PRESET_CATALOG){
 const found=merged.find(p=>p.id===catalog.id);
 if(!found)merged.push({...catalog});
}
if(merged.length!==current.length){persist('standardPoolsV52',merged);P=merged}

localStorage.setItem('allTemplatesEnsuredV543','1');
}
