const TYPES = new Set(['SIGNAL', 'OPPORTUNITY', 'DECISION', 'MISSION', 'OUTCOME', 'PATTERN']);
const AGGREGATE_FIELDS = [
  'credits',
  'operations',
  'dataTransfer',
  'durationMs',
  'creditsPerVerifiedOutcome',
  'latencyMsPerVerifiedOutcome',
  'verifiedOutcomes',
];

function aggregate(value = {}) {
  const output = {};
  for (const field of AGGREGATE_FIELDS) {
    const number = Number(value[field]);
    if (Number.isFinite(number) && number >= 0) output[field] = number;
  }
  return Object.freeze(output);
}

function protectedMetrics(value = {}) {
  return Object.freeze(Object.fromEntries(Object.entries(value)
    .filter(([key, metric]) => /^[a-z][a-z0-9_]{0,63}$/i.test(key) && ['boolean', 'number', 'string'].includes(typeof metric))
    .map(([key, metric]) => [key, typeof metric === 'string' ? metric.slice(0, 100) : metric])));
}

export function toBrainCostEvent(input = {}) {
  if (!TYPES.has(input.type)) throw new TypeError('unsupported Brain cost event type');
  for (const field of ['componentKey', 'traceId', 'correlationId', 'fingerprint']) {
    if (!String(input[field] ?? '').trim()) throw new TypeError(`${field} is required`);
  }
  const confidence = Number(input.confidence ?? 0);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) throw new TypeError('confidence must be 0..1');

  const event = {
    type: input.type,
    schema_version: 'brain.v1',
    source: 'brain-cost-control',
    component: String(input.componentKey),
    component_key: String(input.componentKey),
    fingerprint: String(input.fingerprint),
    trace_id: String(input.traceId),
    correlation_id: String(input.correlationId),
    severity: input.severity ?? 'info',
    owner_agent: String(input.ownerAgentId ?? 'agent-cost'),
    action: String(input.action ?? 'apply governed cost decision').slice(0, 500),
    verification: String(input.verification ?? 'BG167 current-state projection required').slice(0, 500),
    rollback: String(input.rollback ?? 'restore last-known-good component configuration').slice(0, 500),
    confidence,
    evidence: Object.freeze([...(input.evidence ?? [])].map(String).filter(Boolean).slice(0, 20)),
    protected_metrics: protectedMetrics(input.protectedMetrics),
    before: aggregate(input.before),
    after: aggregate(input.after),
  };
  if (input.parentEventId) event.parent_event_id = String(input.parentEventId);
  return Object.freeze(event);
}
