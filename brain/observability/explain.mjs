import { REQUIRED_TRACE_STAGES, traceCompleteness } from './trace.mjs';

const PROVENANCE_KEYS = new Set(['source', 'source_ref', 'origin', 'producer', 'system', 'type', 'version']);

function boundedProvenance(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (!PROVENANCE_KEYS.has(key)) continue;
    if (['string', 'number', 'boolean'].includes(typeof item) && item !== '') out[key] = item;
  }
  return out;
}

function cleanList(value) {
  return Array.isArray(value)
    ? value.filter(item => ['string', 'number', 'boolean'].includes(typeof item))
    : [];
}

function stageAttribution(events, stage) {
  return events
    .filter(event => String(event?.object_type || event?.type || '') === stage)
    .map(event => ({
      ref: String(event?.id || event?.object_id || '').trim(),
      confidence: Number.isFinite(event?.confidence) ? event.confidence : null,
      provenance: boundedProvenance(event?.provenance)
    }))
    .filter(item => item.ref);
}

export function explainDecision(decision, events = []) {
  const id = String(decision?.id || '').trim();
  if (!id) throw new Error('Decision id is required for explainability');
  const traceId = String(decision?.trace_id || '').trim();
  if (!traceId) throw new Error('Trace id is required for explainability');

  const traceEvents = events.filter(event => String(event?.trace_id || '').trim() === traceId);
  const trace = traceCompleteness(traceEvents);
  const attribution = Object.fromEntries(
    REQUIRED_TRACE_STAGES.map(stage => [stage, stageAttribution(traceEvents, stage)])
  );

  return {
    explanation_version: 'brain.explain.v1',
    decision_ref: id,
    trace_id: traceId,
    correlation_id: String(decision?.correlation_id || '').trim() || null,
    decision: decision?.decision ?? null,
    lane: decision?.lane ?? null,
    score: Number.isFinite(decision?.score) ? decision.score : null,
    expected_utility: Number.isFinite(decision?.expected_utility) ? decision.expected_utility : null,
    confidence: Number.isFinite(decision?.confidence) ? decision.confidence : null,
    risk: decision?.risk ?? null,
    autonomy_class: decision?.autonomy_class ?? null,
    reasons: cleanList(decision?.reasons),
    blocked_by: decision?.blocked_by ?? null,
    policy_version: decision?.policy_version ?? null,
    algorithm_version: decision?.algorithm_version ?? null,
    evidence_refs: cleanList(decision?.evidence_refs),
    alternatives: cleanList(decision?.alternatives),
    rejection_reasons: cleanList(decision?.rejection_reasons),
    provenance: boundedProvenance(decision?.provenance),
    trace,
    attribution
  };
}
