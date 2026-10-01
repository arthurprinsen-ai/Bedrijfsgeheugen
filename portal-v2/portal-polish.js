const byId=id=>document.getElementById(id);
const dialog=byId('portalAskAiDialog'),trigger=byId('portalAskAi'),input=byId('portalAskAiInput'),send=byId('portalAskAiSend'),answer=byId('portalAskAiAnswer');
trigger?.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();if(typeof dialog?.showModal==='function'){dialog.showModal();setTimeout(()=>input?.focus(),0)}});
async function ask(){
 const question=String(input?.value||'').trim();if(!question){answer.textContent='Typ eerst je vraag.';return}
 send.disabled=true;answer.textContent='Ik kijk in je portaalcontext…';
 try{
  const response=await fetch('/api/portaalvraag',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({vraag:question})});
  if(!response.ok)throw new Error('Vraag kon niet worden opgehaald');
  const payload=await response.json();answer.textContent=String(payload?.antwoord||payload?.answer||payload?.text||'Er is nog geen onderbouwd antwoord beschikbaar.');
 }catch(error){answer.textContent=error.message||'Vraag kon niet worden opgehaald.'}finally{send.disabled=false}
}
send?.addEventListener('click',ask);input?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();ask()}});
const period=byId('portalPeriod');
period?.addEventListener('change',()=>{document.documentElement.dataset.portalPeriod=period.value;document.dispatchEvent(new CustomEvent('bg:portal-period-change',{detail:{period:period.value}}))});
