const TYPES = new Set(['ERROR','RECOVERY','IMPROVEMENT','OPPORTUNITY','EXPERIMENT_RESULT','CONTRACT_CHANGE']);
const SEVERITIES = new Set(['info','warn','error','critical']);

const isNum = v => typeof v === 'number' && Number.isFinite(v);
const inRange = (v,min,max) => isNum(v) && v >= min && v <= max;

export function validateLearningEvent(event) {
  const errors = [];
  if (!event || typeof event !== 'object') return { valid:false, errors:['event must be an object'] };
  if (!TYPES.has(event.type)) errors.push('type is invalid');
  if (!event.source) errors.push('source is required');
  if (!event.component) errors.push('component is required');
  if (!event.fingerprint) errors.push('fingerprint is required');
  if (!SEVERITIES.has(event.severity)) errors.push('severity is invalid');
  if (!event.owner_agent) errors.push('owner_agent is required');
  if (!event.action) errors.push('action is required');
  if (!event.verification) errors.push('verification is required');
  if (!event.rollback) errors.push('rollback is required');

  if (event.type === 'OPPORTUNITY') {
    if (!inRange(event.evidence_score,0,100)) errors.push('evidence_score must be 0..100');
    if (!inRange(event.novelty_score,0,100)) errors.push('novelty_score must be 0..100');
    if (!inRange(event.business_impact_score,0,100)) errors.push('business_impact_score must be 0..100');
    if (!inRange(event.confidence,0,1)) errors.push('confidence must be 0..1');
    if (!event.metric) errors.push('metric is required');
  }

  return { valid: errors.length === 0, errors };
}
