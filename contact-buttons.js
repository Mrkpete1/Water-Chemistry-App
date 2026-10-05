function contactMarkURL(){
 const pool=cur();
 const body=['Hi Mark,','','I need help with:','','','Pool / System: '+(pool?pool.n:'Not selected'),'Volume: '+(pool?pool.g+' gallons':'Not selected'),'App version: V5.3.4','','My readings / question:',''].join('\r\n');
 return 'mailto:mpeterson@hydroworx.com?subject='+encodeURIComponent('Water chemistry help')+'&body='+encodeURIComponent(body);
}
const contactCard=document.createElement('div');
contactCard.className='card';
contactCard.innerHTML='<details><summary>Need Help? Contact Mark</summary><p>Mark Peterson<br>Startup Specialist</p><p><a id="emailMark" href="mailto:mpeterson@hydroworx.com">Email Mark</a></p><p><a href="tel:+19044138086">Call Mark</a></p><p><a href="sms:+19044138086">Text Mark</a></p><p class="muted">Email includes the selected pool and app version. Add your question or photos before sending. Calling and texting require a compatible device.</p></details>';
contactCard.querySelectorAll('a').forEach(a=>{a.className='secondary';a.style.cssText='display:block;text-align:center;padding:13px;border-radius:10px;font-weight:700;text-decoration:none'});
document.querySelector('main').appendChild(contactCard);
document.getElementById('emailMark').addEventListener('click',function(){this.href=contactMarkURL()});
