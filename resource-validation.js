// Resource links are part of a shareable setup, never an access-control boundary.
function validatePoolResources(r){
 if(!r||typeof r!=='object'||!Array.isArray(r.manuals)||r.manuals.length>5)throw Error('Invalid pool resources.');
 const manuals=r.manuals.map(m=>{
  if(typeof m.title!=='string'||!m.title.trim()||m.title.length>100||typeof m.url!=='string'||m.url.length>2000)throw Error('Invalid document link.');
  const url=new URL(m.url);if(url.protocol!=='https:'||url.username||url.password)throw Error('Use an HTTPS document link.');
  return {title:m.title.trim(),url:url.href};
 });
 if(typeof r.tips!=='string'||r.tips.length>1500||typeof r.notes!=='string'||r.notes.length>300)throw Error('Resource notes are too long.');
 return {manuals,tips:r.tips.trim(),notes:r.notes.trim()};
}
