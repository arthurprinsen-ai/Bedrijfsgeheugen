(()=>{'use strict';
const API='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-growth-tools';
const q=(s,r=document)=>r.querySelector(s);
const money=n=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n||0));
const pct=n=>Math.round(Number(n||0)*100);
async function call(payload){
  const res=await fetch(API,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok||!data.ok)throw new Error(data.error||'TOOL_UNAVAILABLE');
  return data;
}
function val(root,name,scale=1,def=0){
  const el=q('[name="'+name+'"]',root); const n=Number(el?.value);
  return Number.isFinite(n)?n*scale:def;
}
function initLost(root){
  const out=q('[data-growth-output]',root),btn=q('button',root);
  if(!out||!btn)return;
  btn.addEventListener('click',async()=>{
    btn.disabled=true;out.textContent='Berekenen…';
    try{
      const d=await call({tool:'lost-knowledge',employees:val(root,'employees'),turnover_rate:val(root,'turnover',.01),avg_loaded_cost_eur:val(root,'cost'),critical_knowledge_share:val(root,'critical',.01,.25),recovery_months:val(root,'months',1,4)});
      const r=d.result||{};
      out.innerHTML='<b>'+money(r.estimated_annual_knowledge_loss_eur)+'</b><span>scenario per jaar · geschat vertrek '+(r.estimated_people_leaving??'—')+' medewerkers</span><small>Scenario-inschatting, geen geobserveerde schade.</small>';
    }catch(e){out.innerHTML='<b>Nu niet beschikbaar</b><small>Probeer het later opnieuw.</small>'}
    finally{btn.disabled=false;}
  });
}
function initMa(root){
  const out=q('[data-growth-output]',root),btn=q('button',root);
  if(!out||!btn)return;
  btn.addEventListener('click',async()=>{
    btn.disabled=true;out.textContent='Berekenen…';
    try{
      const d=await call({tool:'ma-risk',key_person_dependency:val(root,'key_person',.01),process_documentation_gap:val(root,'process_gap',.01),management_information_gap:val(root,'management_gap',.01),system_fragmentation:val(root,'fragmentation',.01),knowledge_concentration:val(root,'knowledge_concentration',.01)});
      const r=d.result||{};
      const qs=Array.isArray(r.due_diligence_questions)?r.due_diligence_questions.slice(0,3):[];
      out.innerHTML='<b>'+pct(r.risk_score)+'/100 · '+String(r.risk_band||'')+'</b><span>'+qs.join(' · ')+'</span><small>Estimated risk; geen waardering of transactieadvies.</small>';
    }catch(e){out.innerHTML='<b>Nu niet beschikbaar</b><small>Probeer het later opnieuw.</small>'}
    finally{btn.disabled=false;}
  });
}
function initFriction(root){
  const out=q('[data-growth-output]',root),btn=q('button',root);
  if(!out||!btn)return;
  btn.addEventListener('click',async()=>{
    btn.disabled=true;out.textContent='Benchmark laden…';
    try{
      const sector=String(q('[name="sector"]',root)?.value||'').trim();
      const d=await call({tool:'friction-index',sector});
      const rows=Array.isArray(d.rows)?d.rows:[];
      if(!rows.length){out.innerHTML='<b>Nog onvoldoende data</b><span>We tonen pas een benchmark vanaf vijf geanonimiseerde waarnemingen.</span><small>Geen score is beter dan een verzonnen score.</small>';return;}
      const r=rows[0];
      out.innerHTML='<b>'+pct(r.friction_index)+'/100 frictie</b><span>'+String(r.branche||'')+' · n='+r.sample_size+' · '+String(r.friction_band||'')+'</span><small>Geaggregeerde benchmark; geen individuele bedrijfsdata.</small>';
    }catch(e){out.innerHTML='<b>Benchmark nu niet beschikbaar</b><small>Probeer het later opnieuw.</small>'}
    finally{btn.disabled=false;}
  });
}
async function initWorkshop(root){
  const out=q('[data-growth-output]',root);
  if(!out)return;
  const p=new URLSearchParams(location.search),workshop=p.get('workshop_key')||p.get('workshop'),submission=p.get('submission_key')||'';
  if(!workshop){out.innerHTML='<b>Live benchmark klaar voor workshops</b><span>Een unieke workshop-QR koppelt deelnemers aan één anonieme cohortbenchmark. Resultaten verschijnen pas vanaf vijf geldige inzendingen.</span>';return;}
  out.textContent='Workshopbenchmark laden…';
  try{
    const d=await call({tool:'workshop-benchmark',workshop_key:workshop,submission_key:submission});
    const s=d.summary||{},own=d.participant;
    if(!s.sample_size){out.innerHTML='<b>Nog onvoldoende deelnemers</b><span>De benchmark wordt zichtbaar zodra de privacygrens is gehaald.</span>';return;}
    out.innerHTML='<b>'+s.sample_size+' deelnemers</b><span>Groepsgemiddelde '+pct(s.average)+'/100'+(own?' · jouw percentiel '+pct(own.percentile_rank):'')+'</span><small>Geen namen of individuele deelnemers worden openbaar gemaakt.</small>';
  }catch(e){out.innerHTML='<b>Benchmark nu niet beschikbaar</b><small>De scan zelf blijft gewoon bruikbaar.</small>'}
}
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-growth-tool="lost-knowledge"]').forEach(initLost);
  document.querySelectorAll('[data-growth-tool="ma-risk"]').forEach(initMa);
  document.querySelectorAll('[data-growth-tool="friction-index"]').forEach(initFriction);
  document.querySelectorAll('[data-growth-tool="workshop-benchmark"]').forEach(initWorkshop);
});
})();