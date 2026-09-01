import { normalizeUniversalEvent } from './universal-event-envelope.mjs';
import { classifyRetention } from './event-retention-policy.mjs';

export function deliveryFailureToUniversalEvent(observedFailure, now = new Date().toISOString()) {
  const fingerprint = String(observedFailure?.fingerprint ?? '').trim();
  if (!fingerprint) throw new TypeError('delivery failure fingerprint is required');
  const headSha = String(observedFailure?.headSha ?? '').trim() || 'unknown-head';
  const evidenceRef = String(observedFailure?.evidenceRef ?? '').trim();
  const component = String(observedFailure?.component ?? 'shared').trim() || 'shared';
  const stage = String(observedFailure?.stage ?? 'PIPELINE').trim().toUpperCase();

  const normalized = normalizeUniversalEvent({
    event_id: `github-delivery|${fingerprint}|${headSha}`,
    occurred_at: now,
    source_system: 'github',
    producer_id: 'unified-brain-delivery',
    domain: 'delivery',
    event_type: 'incident',
    severity: 'error',
    entity_keys: [`component:${component}`, `commit:${headSha}`],
    correlation_id: headSha,
    attribution_root_key: `delivery:${headSha}`,
    fingerprint,
    evidence_refs: evidenceRef ? [evidenceRef] : [],
    payload: {
      type: observedFailure?.type ?? 'DELIVERY_FAILURE_OBSERVED',
      stage,
      component,
      reason: observedFailure?.reason ?? observedFailure?.normalizedReason ?? '',
      normalized_reason: observedFailure?.normalizedReason ?? '',
      status: observedFailure?.status ?? 'OBSERVED',
      requires_root_cause_resolution: observedFailure?.requiresRootCauseResolution === true,
      original_fingerprint: fingerprint,
    },
    payload_class: 'evidence',
    privacy_class: 'internal',
    status: 'OBSERVED',
  }, now);

  const retention = classifyRetention(normalized);
  return Object.freeze({
    ...normalized,
    retention_tier: retention.retentionTier,
    raw_retention_days: retention.rawRetentionDays,
    durable_learning_required: true,
    repairable: false,
    repair_owner: 'agent-reliability',
  });
}
