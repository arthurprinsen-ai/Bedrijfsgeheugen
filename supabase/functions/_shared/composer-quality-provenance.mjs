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
