/**
 * Tenant-safe client presentation of the canonical external intelligence graph.
 * Does not change scoring, send outreach or infer company exposure/revenue.
 */
const finite=value=>value!==null&&value!==''&&Number.isFinite(Number(value));
const dateMs=value=>{
  if(!value)return null;
  const n=Date.parse(String(value));
  return Number.isFinite(n)?n:null;
};
export function verifiedExternalUrl(value){
  try{
    const u=new URL(String(value||''));
    if(u.protocol!=='https:'||u.username||u.password||!u.hostname||/^(localhost|127\\.|10\\.|192\\.168\\.|0\\.|::1$)/i.test(u.hostname))return null;
    return u.href;
  }catch{return null;}
}
export function signalDecision(item={},actions=[],{now=Date.now()}={}){
  const time=now instanceof Date?now.getTime():Number(now);
  const at=Number.isFinite(time)?time:Date.now();
  const published=dateMs(item.published_at);
  const observed=dateMs(item.observed_at);
  const end=dateMs(item.deadline?String(item.deadline).slice(0,10)+'T23:59:59Z':null);
  const deadlineExpired=end!==null&&end<at;
  const datedSource=published!==null&&published<=at;
  const stale=!datedSource||at-published>45*86400000;
  const realUrl=verifiedExternalUrl(item.external_url);
  const score=finite(item.source_confidence)?Number(item.source_confidence):null;
  const verifiedSource=!!realUrl&&score!==null&&score>=0.6&&datedSource;
  const companyImpacts=Array.isArray(item.company_impacts)?item.company_impacts:[];
  const scoredCompany=companyImpacts.find(x=>x.status==='SCORED'&&finite(x.impact_score));
  const relevantToCompany=!!scoredCompany&&item.impact_status==='SCORED';
  const linkedAction=actions.filter(a=>a?.signal_key===item.signal_key)
    .sort((a,b)=>Number(Boolean(b.tenant_specific))-Number(Boolean(a.tenant_specific))+
      (0))[0]||null;
  const executable=!!linkedAction?.canonical_action_ref&&linkedAction?.status==='MATERIALIZED'&&
    !!linkedAction?.tenant_specific&&relevantToCompany&&!deadlineExpired&&verifiedSource&&!stale;
  const reason=relevantToCompany
    ? String(scoredCompany.rationale||'De bedrijfsspecifieke impact is beoordeeld; controleer de onderliggende berekening.')
    : 'Dit is een extern marktsignaal. Relevantie voor jouw bedrijf is nog niet bewezen; controleer branche, activiteiten, doelen en blootstelling.';
  let nextStep;
  if(deadlineExpired)nextStep='Deadline verstreken. Controleer een nieuwe officiële openstelling voordat je een aanvraag, campagne of verkoopactie start.';
  else if(!realUrl)nextStep='Vraag eerst een betrouwbare, rechtstreeks te openen bron op; onderneem nog geen externe actie.';
  else if(stale)nextStep='Verifieer publicatiedatum en actuele voorwaarden bij de bron vóór je handelt.';
  else if(!verifiedSource)nextStep='Controleer bronbetrouwbaarheid en bevestiging voordat je besluit of dit relevant is.';
  else if(!relevantToCompany)nextStep='Beoordeel eerst of het signaal jouw branche, doelen of klanten raakt; leg de bedrijfsspecifieke impact vast.';
  else if(executable)nextStep='Open de gekoppelde bedrijfsactie, bepaal eigenaar en deadline, en leg de uitkomst vast.';
  else if(linkedAction?.tenant_specific)nextStep='Beoordeel het bestaande voorstel met de verantwoordelijke; voer het pas uit na de gebruikelijke controles.';
  else nextStep='Beoordeel de impact op jouw bedrijf en maak pas daarna een uitvoerbare actie met eigenaar.';
  return {
    sourceUrl:realUrl,sourceStatus:!realUrl?'BRON_ONTBREEKT':!verifiedSource?'BRON_TE_VERIFIËREN':stale?'VEROUDERD':'BRON_GEOBSERVEERD',
    deadlineExpired,stale,verifiedSource,relevantToCompany,reason,nextStep,
    action:linkedAction,executable,companyLabel:scoredCompany?.target_label||null,
    publishedAt:datedSource?new Date(published).toISOString():null,
    observedAt:observed!==null&&observed<=at?new Date(observed).toISOString():null
  };
}
