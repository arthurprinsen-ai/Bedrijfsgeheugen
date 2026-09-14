const DEFAULT_MINIMUM_CONFIDENCE = 0.9;

const SUPPORTED_SIGNALS = Object.freeze({
  meeting_completed: { meeting: true, proposal: false, order: false },
  proposal_sent: { meeting: false, proposal: true, order: false },
  proposal_accepted: { meeting: false, proposal: true, order: false },
  deal_won: { meeting: false, proposal: false, order: true },
  order_accepted: { meeting: false, proposal: false, order: true },
  payment_received: { meeting: false, proposal: false, order: true },
});

function requiredString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name.toUpperCase()}_REQUIRED`);
  return value.trim();
}

function normalizedConfidence(value) {
  const confidence = Number(value);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new TypeError('CONFIDENCE_REQUIRED');
  }
  return confidence;
}

function exactOpenPrediction(projection, decisionId, predictionId) {
  const predictions = Array.isArray(projection?.revenuePredictions) ? projection.revenuePredictions : [];
  return predictions.find((candidate) => {
    const candidateDecisionId = candidate?.decisionId ?? candidate?.prediction?.decision_id;
    const candidatePredictionId = candidate?.prediction?.prediction_id ?? candidate?.predictionId;
    return candidate?.status === 'OPEN'
      && candidateDecisionId === decisionId
      && candidatePredictionId === predictionId;
  }) ?? null;
}

export function createCommercialOutcomeSignalIngestor({
  getProjection,
  recordOutcome,
  minimumConfidence = DEFAULT_MINIMUM_CONFIDENCE,
} = {}) {
  if (typeof getProjection !== 'function') throw new TypeError('GET_PROJECTION_REQUIRED');
  if (typeof recordOutcome !== 'function') throw new TypeError('RECORD_OUTCOME_REQUIRED');
  if (!Number.isFinite(minimumConfidence) || minimumConfidence < 0 || minimumConfidence > 1) {
    throw new TypeError('MINIMUM_CONFIDENCE_INVALID');
  }

  return async function ingestCommercialOutcomeSignal(signal = {}) {
    const tenantId = requiredString(signal.tenantId, 'tenant_id');
    const source = requiredString(signal.source, 'source');
    const signalId = requiredString(signal.signalId, 'signal_id');
    const type = requiredString(signal.type, 'type');
    const decisionId = requiredString(signal.decisionId, 'decision_id');
    const predictionId = requiredString(signal.predictionId, 'prediction_id');
    const confidence = normalizedConfidence(signal.confidence);
    const evidenceRefs = Array.isArray(signal.evidenceRefs)
      ? signal.evidenceRefs.filter((ref) => typeof ref === 'string' && ref.trim()).map((ref) => ref.trim())
      : [];

    if (!evidenceRefs.length) throw new TypeError('EVIDENCE_REQUIRED');
    const flags = SUPPORTED_SIGNALS[type];
    if (!flags) throw new TypeError('UNSUPPORTED_COMMERCIAL_OUTCOME_SIGNAL');

    const projection = await getProjection(tenantId);
    const prediction = exactOpenPrediction(projection, decisionId, predictionId);
    if (!prediction) {
      return { status: 'UNMATCHED', decisionId, predictionId, source, signalId };
    }

    if (signal.verified !== true || confidence < minimumConfidence) {
      return {
        status: 'REVIEW_REQUIRED',
        decisionId,
        predictionId,
        source,
        signalId,
        confidence,
        verified: signal.verified === true,
      };
    }

    const realizedValue = Number(signal.realizedValue ?? 0);
    if (!Number.isFinite(realizedValue)) throw new TypeError('REALIZED_VALUE_INVALID');
    const currency = typeof signal.currency === 'string' && signal.currency.trim() ? signal.currency.trim() : 'EUR';
    const occurredAt = signal.occurredAt == null ? undefined : requiredString(signal.occurredAt, 'occurred_at');

    const command = {
      command: 'RECORD_OUTCOME',
      decisionId,
      idempotencyKey: `outcome-signal:${source}:${signalId}`,
      commercial: true,
      verified: true,
      meeting: flags.meeting,
      proposal: flags.proposal,
      order: flags.order,
      realizedValue,
      currency,
      result: {
        signalType: type,
        source,
        signalId,
        predictionId,
        ...(occurredAt ? { occurredAt } : {}),
        confidence,
      },
      evidenceIds: evidenceRefs,
    };

    const canonicalResult = await recordOutcome(command, { tenantId, prediction });
    return {
      status: 'SETTLED',
      decisionId,
      predictionId,
      source,
      signalId,
      canonicalResult,
    };
  };
}

export const COMMERCIAL_OUTCOME_SIGNAL_INGEST_CONTRACT = Object.freeze({
  id: 'COMMERCIAL-OUTCOME-SIGNAL-INGEST-v1',
  minimumConfidence: DEFAULT_MINIMUM_CONFIDENCE,
  delegatesTo: 'RECORD_OUTCOME',
  ownsPersistence: false,
  supportedSignals: Object.freeze(Object.keys(SUPPORTED_SIGNALS)),
});
