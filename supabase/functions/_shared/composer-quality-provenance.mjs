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
export function composerSourcePreflight(action,plan){
 const ev=action?.evidence||{}, pub=ev?.public_source_evidence?.evidence||{};
 const sourceText=nonempty(ev?.headline||ev?.summary||pub?.headline||pub?.summary);
 const missing=[];
 if(plan?.human_readable_context!==true)missing.push('human_readable_context');
 if(plan?.source_trigger_relevance!==true)missing.push('source_trigger_relevance');
 if(!nonempty(action?.source_url).startsWith('https://'))missing.push('https_source_url');
 if(sourceText.length<24)missing.push('specific_source_context');
 return Object.freeze({ok:missing.length===0,missing:Object.freeze(missing)});
}
