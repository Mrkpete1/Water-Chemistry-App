// Ensure every owner-approved catalog entry is available as a protected template.
// Existing edits are retained by stable ID; missing entries are restored once.
if(!localStorage.getItem('allPresetTemplatesV541')){
 const current=Array.isArray(P)?P:[];
 const merged=current.map(p=>({...p}));
 for(const catalog of PRESET_CATALOG){
  const found=merged.find(p=>p.id===catalog.id);
  if(!found)merged.push({...catalog});
 }
 persist('standardPoolsV52',merged);P=merged;
 localStorage.setItem('allPresetTemplatesV541','1');
}
