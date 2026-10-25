/**
 * Portal V2 — interpreteer canonieke externe bronfeiten zonder klantimpact te verzinnen.
 * Alleen de beveiligde entrepreneur_intelligence-read levert tenant-scope.
 * Deze projector voert niets uit en schrijft geen eigen queue/CRM.
 */
const rows=value=>Array.isArray(value)?value:[];
const text=value=>String(value??'').trim();
const validNumber=value=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));
const recent=(value,now,days)=>{const when=Date.parse(value||'');return Number.isFinite(when)&&when<=now&&when>=now-days*86400000;};
const reviewSteps=Object.freeze({
  regulation:'Controleer of de officiële verplichting voor jouw sector, proces en omvang geldt. Noteer de deadline en wijs een verantwoordelijke aan.',
  subsidies:'Controleer doelgroep, voorwaarden en indienperiode bij de regeling. Leg eerst vast of je bedrijf in aanmerking komt.',
  labour:'Vergelijk de ontwikkeling met je eigen personeels- en capaciteitsgegevens voordat je het wervingsplan aanpast.',
  cyber:'Controleer welke systemen en leveranciers geraakt kunnen worden; beoordeel daarna de benodigde beveiligingsmaatregelen.',
  competition:'Vergelijk het signaal met je eigen klanten, aanbod en prijsinformatie voordat je een commercieel besluit neemt.',
  market:'Vergelijk dit met je eigen markt, klanten en omzetontwikkeling voordat je een actie prioriteert.',
  technology:'Toets toepasbaarheid, kosten, gegevensbescherming en resultaat in een afgebakende proef.',
  search:'Vergelijk het zoek- of vraagsignaal met je eigen verkeer en conversies voordat je content wijzigt.'
});
function stepForDomain(value){
  const domain=text(value).toLowerCase();
  if(/subsid|tax|grant|finance/.test(domain))return reviewSteps.subsidies;
  if(/regul|law|legal|compliance|wet/.test(domain))return reviewSteps.regulation;
  if(/labour|people|skill|arbeid|personeel/.test(domain))return reviewSteps.labour;
  if(/cyber|fraud|security/.test(domain))return reviewSteps.cyber;
  if(/compet|pric/.test(domain))return reviewSteps.competition;
  if(/techn|innov|ai/.test(domain))return reviewSteps.technology;
  if(/seo|search|demand/.test(domain))return reviewSteps.search;
  return reviewSteps.market;
}
export function safeExternalSourceUrl(value){
  try{
    const url=new URL(text(value));
    return url.protocol==='https:'&&!url.username&&!url.password&&url.hostname?url.href:null;
  }catch{return null;}
}
export function buildExternalSignalAdvice(signal={}, {actions=[],sourceCatalog=[],now=Date.now()}={}){
  const signalKey=text(signal.signal_key);
  const source=rows(sourceCatalog).find(s=>text(s.source_key)===text(signal.source_key))||null;
  const related=signalKey?rows(actions).filter(a=>text(a.signal_key)===signalKey):[];
  const tenant=related.filter(a=>a.tenant_specific===true&&a.projection_scope==='TENANT')
    .sort((a,b)=>(Number(b.priority_score)||0)-(Number(a.priority_score)||0))[0]||null;
  const general=related.find(a=>a.tenant_specific===false&&a.projection_scope==='CANONICAL_REVIEW')||null;
  const scored=signal.tenant_specific_impact===true&&signal.impact_status==='SCORED'
    ?rows(signal.company_impacts).filter(x=>x.status==='SCORED'&&validNumber(x.impact_score)).sort((a,b)=>Number(b.impact_score)-Number(a.impact_score))[0]||null
    :null;
  const sourceAt=signal.observed_at||null;
  const fresh=recent(sourceAt,now,1);
  const url=safeExternalSourceUrl(signal.external_url)||safeExternalSourceUrl(source?.canonical_url);
  const companySpecific=Boolean(scored);
  let nextStep=stepForDomain(signal.domain_key);
  let actionType='VERIFY_CONTEXT';
  let actionStatus='REVIEW_REQUIRED';
  if(tenant){
    nextStep=text(tenant.title)||nextStep;
    actionType=tenant.canonical_action_ref?'ASSIGNED':tenant.status==='DONE'?'OUTCOME_REVIEW':'TENANT_PROPOSAL';
    actionStatus=text(tenant.status)||'CANDIDATE';
  }else if(general){
    nextStep=stepForDomain(signal.domain_key);
    actionType='GENERAL_PROPOSAL';
    actionStatus='REVIEW_REQUIRED';
  }
  const sourceStatus=text(source?.availability_state)||'UNKNOWN';
  return Object.freeze({
    signalKey,
    sourceLabel:text(source?.label)||text(source?.publisher)||text(signal.source_key)||'Bron onbekend',
    publisher:text(source?.publisher)||'Uitgever niet geregistreerd',
    sourceStatus,
    sourceObservedAt:source?.last_observed_at||null,
    observationFresh24h:fresh,
    externalUrl:url,
    impactProven:companySpecific,
    impactTarget:companySpecific?text(scored.target_label):'',
    impactReason:companySpecific?text(scored.rationale):'',
    impactScore:companySpecific?Number(scored.impact_score):null,
    expectedValueEur:companySpecific&&validNumber(signal.estimated_value_eur)?Number(signal.estimated_value_eur):null,
    expectedLossEur:companySpecific&&validNumber(signal.estimated_loss_eur)?Number(signal.estimated_loss_eur):null,
    nextStep,
    actionType,
    actionStatus,
    actionTitle:tenant?text(tenant.title):general?text(general.title):'',
    owner:tenant?text(tenant.owner_hint):'',
    dueAt:tenant?tenant.due_at||null:null,
    hasCanonicalAction:Boolean(tenant?.canonical_action_ref),
    scopeLabel:companySpecific?'Bedrijfsspecifiek onderbouwd':'Mogelijk relevant · eerst eigen context toetsen',
    confidence:validNumber(signal.source_confidence)&&Number(signal.source_confidence)>=0&&Number(signal.source_confidence)<=1?Math.round(Number(signal.source_confidence)*100):null
  });
}