// Actual composer-source provenance only. No delivery, conversion or revenue claims.
export const COMPOSER_ACTOR_ID='powerhouse-commercial-message-composer';
const validScore=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<=1;
export function composerQualityProvenance({actionId,hash,contract,previousScore,currentScore}){
  if(typeof actionId!=='string'||!/^[0-9a-f-]{36}$/i.test(actionId)
    ||typeof hash!=='string'||!/^[0-9a-f]{64}$/i.test(hash)
    ||contract!=='powerhouse-human-commercial-message-composer-v2'
    ||!validScore(currentScore))throw new Error('COMPOSER_QUALITY_PROVENANCE_INVALID');
  return Object.freeze({
    agent_id:COMPOSER_ACTOR_ID,
    skill_version:contract,
    actor_scope:'message_composition',
    metric_name:'draft_quality_score',
    before_metric:validScore(previousScore)?previousScore:null,
    after_metric:currentScore,
    metric_evidence_ref:`powerhouse_message_quality_v1:${actionId}:${hash}`,
    metric_truth_class:'observed_draft_quality_not_customer_outcome',
    source_authority:'powerhouse_message_quality_v1'
  });
}

const nonempty=value=>typeof value==='string'?value.trim():String(value??'').trim();
// Besluit 27 okt 2026: koude mails aan kleine Nederlandse contacten mogen een ander verifieerbaar feit
// gebruiken dan nieuws: functie, bedrijf, eerder gesprek of status in_gesprek. Alleen feiten uit het eigen
// relatiedossier tellen (action.evidence.relationship_evidence); een gegeven zonder waarde telt niet mee.
// Minimaal twee verschillende feiten, zodat een kale naam of alleen een bedrijfsnaam nooit volstaat.
export function relationshipFact(action){
 const r=action?.evidence?.relationship_evidence;
 if(!r||typeof r!=='object')return Object.freeze({ok:false,facts:Object.freeze([]),text:''});
 const facts=[];
 const role=nonempty(r.role||action?.role), company=nonempty(r.company_name||action?.company_name);
 const prior=nonempty(r.prior_conversation||r.last_message||r.last_contact_summary);
 const status=nonempty(r.status||r.relationship_status).toLowerCase();
 if(role.length>=3)facts.push('role');
 if(company.length>=2)facts.push('company');
 if(prior.length>=24)facts.push('prior_conversation');
 if(status==='in_gesprek')facts.push('status_in_gesprek');
 const text=[role,company,prior,status==='in_gesprek'?'in gesprek':''].filter(Boolean).join('. ');
 return Object.freeze({ok:facts.length>=2,facts:Object.freeze(facts),text});
}
export function composerSourcePreflight(action,plan){
 const ev=action?.evidence||{}, pub=ev?.public_source_evidence?.evidence||{};
 const sourceText=nonempty(ev?.headline||ev?.summary||pub?.headline||pub?.summary);
 const missing=[];
 if(plan?.human_readable_context!==true)missing.push('human_readable_context');
 const newsOk=plan?.source_trigger_relevance===true&&nonempty(action?.source_url).startsWith('https://')&&sourceText.length>=24;
 const relationship=relationshipFact(action);
 if(!newsOk&&!relationship.ok){
  if(plan?.source_trigger_relevance!==true)missing.push('source_trigger_relevance');
  if(!nonempty(action?.source_url).startsWith('https://'))missing.push('https_source_url');
  if(sourceText.length<24)missing.push('specific_source_context');
  missing.push('relationship_fact_min_two');
 }
 return Object.freeze({ok:missing.length===0,missing:Object.freeze(missing),via:newsOk?'news':(relationship.ok?'relationship_fact':null)});
}
