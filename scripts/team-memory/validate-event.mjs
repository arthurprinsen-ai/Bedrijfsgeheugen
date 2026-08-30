const TYPES = new Set(['ERROR','RECOVERY','IMPROVEMENT','OPPORTUNITY','EXPERIMENT_RESULT','CONTRACT_CHANGE','PRODUCTION_PROMOTION','PRODUCTION_ROLLBACK']);
const BRAIN_TYPES = new Set(['SIGNAL','OPPORTUNITY','DECISION','MISSION','OUTCOME','PATTERN']);
const SEVERITIES = new Set(['info','warn','error','critical']);

const isNum = v => typeof v === 'number' && Number.isFinite(v);
const inRange = (v,min,max) => isNum(v) && v >= min && v <= max;

export function validateLearningEvent(event) {
  const errors = [];
  if (!event || typeof event !== 'object') return { valid:false, errors:['event must be an object'] };
  const isBrainEvent = event.schema_version === 'brain.v1';
  if (isBrainEvent ? !BRAIN_TYPES.has(event.type) : !TYPES.has(event.type)) errors.push('type is invalid');
  if (!event.source) errors.push('source is required');
  if (!event.component) errors.push('component is required');
  if (!event.fingerprint) errors.push('fingerprint is required');
  if (!SEVERITIES.has(event.severity)) errors.push('severity is invalid');
  if (!event.owner_agent) errors.push('owner_agent is required');
  if (!event.action) errors.push('action is required');
  if (!event.verification) errors.push('verification is required');
  if (!event.rollback) errors.push('rollback is required');

  if (isBrainEvent) {
    if (!event.trace_id) errors.push('trace_id is required');
    if (!event.correlation_id) errors.push('correlation_id is required');
    if (!event.component_key) errors.push('component_key is required');
    if (!inRange(event.confidence,0,1)) errors.push('confidence must be 0..1');
  }

  if (event.type === 'OPPORTUNITY' && !isBrainEvent) {
    if (!inRange(event.evidence_score,0,100)) errors.push('evidence_score must be 0..100');
    if (!inRange(event.novelty_score,0,100)) errors.push('novelty_score must be 0..100');
    if (!inRange(event.business_impact_score,0,100)) errors.push('business_impact_score must be 0..100');
    if (!inRange(event.confidence,0,1)) errors.push('confidence must be 0..1');
    if (!event.metric) errors.push('metric is required');
  }

  return { valid: errors.length === 0, errors };
}
