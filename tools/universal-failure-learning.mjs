import { normalizeUniversalEvent } from './universal-event-envelope.mjs';

const REQUIRED_PROVEN = [
  'rootCause',
  'failedApproach',
  'fix',
  'preventionRule',
  'regressionContract',
  'outcomeEvidence',
];

function text(value) {
  return String(value ?? '').trim();
}

export function evaluateFailureLearningReadiness(input = {}) {
  const missing = REQUIRED_PROVEN.filter(field => !text(input[field]));
  if (!Array.isArray(input.evidence_refs) || input.evidence_refs.length === 0) missing.push('evidence_refs');
  return Object.freeze({ proven: missing.length === 0, missing: Object.freeze(missing) });
}

export function buildFailureLearningEvent(input = {}, now = new Date().toISOString()) {
  const readiness = evaluateFailureLearningReadiness(input);
  if (!readiness.proven) {
    throw new Error(`FAILURE_LEARNING_NOT_PROVEN:${readiness.missing.join(',')}`);
  }

  const event = normalizeUniversalEvent({
    event_id: text(input.event_id),
    occurred_at: input.occurred_at || now,
    source_system: text(input.source_system),
    producer_id: text(input.producer_id),
    domain: text(input.domain || input.component || 'reliability'),
    event_type: 'durable-learning',
    severity: text(input.severity || 'error'),
    entity_keys: Array.isArray(input.entity_keys) ? input.entity_keys : [input.component ? `component:${text(input.component)}` : 'component:unknown'],
    correlation_id: text(input.correlation_id),
    attribution_root_key: text(input.attribution_root_key || input.fingerprint),
    fingerprint: text(input.fingerprint),
    evidence_refs: input.evidence_refs,
    payload: {
      component: text(input.component),
      errorCode: text(input.error_code),
      message: text(input.message),
      rootCause: text(input.rootCause),
      failedApproach: text(input.failedApproach),
      fix: text(input.fix),
      preventionRule: text(input.preventionRule),
      regressionContract: text(input.regressionContract),
      outcomeEvidence: text(input.outcomeEvidence),
      owner: text(input.owner || 'agent-reliability'),
    },
    payload_class: 'learning',
    privacy_class: text(input.privacy_class || 'internal'),
    retention_tier: 3,
    status: 'PROVEN',
  }, now);

  return Object.freeze({
    ...event,
    retention_tier: 3,
    durable_learning_required: true,
    status: 'PROVEN',
    repairable: false,
    repair_owner: text(input.owner || 'agent-reliability'),
  });
}
