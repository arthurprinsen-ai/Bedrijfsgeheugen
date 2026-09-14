const clamp01 = value => Math.max(0, Math.min(1, Number(value) || 0));
const round = (value, digits = 4) => Number(Number(value).toFixed(digits));
const clone = value => structuredClone(value);

function probability(name, value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1) {
    throw new Error(`${name} must be a probability between 0 and 1`);
  }
  return numeric;
}

function finiteNonNegative(name, value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric < 0) throw new Error(`${name} must be a non-negative number`);
  return numeric;
}

function binary(value) {
  return value === true || Number(value) === 1 ? 1 : 0;
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

export function createDecisionPrediction({
  decisionId,
  entityId,
  opportunityScore,
  confidence,
  meetingProbability,
  expectedCommercialValue = 0,
  recommendedAction,
  evidenceRefs = [],
  modelVersion = 'unknown',
  predictedAt = new Date().toISOString(),
} = {}) {
  if (!decisionId) throw new Error('decisionId is required');
  if (!entityId) throw new Error('entityId is required');
  const score = Number(opportunityScore);
  if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error('opportunityScore must be between 0 and 100');
  if (!recommendedAction?.type) throw new Error('recommendedAction.type is required');

  return freeze({
    schema_version: 'powerhouse.decision-prediction.v1',
    decision_id: String(decisionId),
    entity_id: String(entityId),
    predicted_at: new Date(predictedAt).toISOString(),
    model_version: String(modelVersion),
    prediction: {
      opportunity_score: round(score, 2),
      confidence: round(probability('confidence', confidence)),
      meeting_probability: round(probability('meetingProbability', meetingProbability)),
      expected_commercial_value: round(finiteNonNegative('expectedCommercialValue', expectedCommercialValue), 2),
    },
    recommended_action: clone(recommendedAction),
    evidence_refs: [...new Set(evidenceRefs.filter(Boolean).map(String))],
    status: 'open',
  });
}

export function settleDecisionOutcome({ prediction, outcome = {} } = {}) {
  if (!prediction?.decision_id || prediction?.schema_version !== 'powerhouse.decision-prediction.v1') {
    throw new Error('prediction must be an originating decision prediction');
  }

  const meeting = binary(outcome.meeting);
  const proposal = binary(outcome.proposal);
  const order = binary(outcome.order);
  const revenue = finiteNonNegative('revenue', outcome.revenue ?? 0);
  const p = probability('prediction.meeting_probability', prediction.prediction?.meeting_probability);
  const expectedRevenue = finiteNonNegative('prediction.expected_commercial_value', prediction.prediction?.expected_commercial_value ?? 0);
  const occurredAt = outcome.occurredAt ? new Date(outcome.occurredAt).toISOString() : new Date().toISOString();

  return freeze({
    schema_version: 'powerhouse.decision-outcome.v1',
    decision_id: prediction.decision_id,
    entity_id: prediction.entity_id,
    prediction,
    action: {
      recommended: clone(prediction.recommended_action),
      executed: Boolean(outcome.actionExecuted),
    },
    outcome: {
      meeting,
      proposal,
      order,
      revenue: round(revenue, 2),
      occurred_at: occurredAt,
      evidence_refs: [...new Set((outcome.evidenceRefs ?? []).filter(Boolean).map(String))],
    },
    learning: {
      meeting_brier_score: round((p - meeting) ** 2),
      probability_error: round(p - meeting),
      revenue_error: round(revenue - expectedRevenue, 2),
      revenue_realization_ratio: expectedRevenue > 0 ? round(revenue / expectedRevenue) : null,
    },
    status: 'settled',
  });
}

function calibrationBins(rows, binCount) {
  const bins = Array.from({ length: binCount }, (_, index) => ({
    min: index / binCount,
    max: (index + 1) / binCount,
    probabilities: [],
    outcomes: [],
  }));

  for (const row of rows) {
    const index = Math.min(binCount - 1, Math.floor(row.p * binCount));
    bins[index].probabilities.push(row.p);
    bins[index].outcomes.push(row.y);
  }

  return bins
    .filter(bin => bin.probabilities.length > 0)
    .map(bin => ({
      min_probability: round(bin.min),
      max_probability: round(bin.max),
      sample_size: bin.probabilities.length,
      mean_predicted_probability: round(bin.probabilities.reduce((a, b) => a + b, 0) / bin.probabilities.length),
      actual_positive_rate: round(bin.outcomes.reduce((a, b) => a + b, 0) / bin.outcomes.length),
    }));
}

export function calculateCalibrationMetrics({
  settledDecisions = [],
  positiveThreshold = 0.5,
  binCount = 10,
} = {}) {
  const threshold = probability('positiveThreshold', positiveThreshold);
  const bins = Math.max(2, Math.min(20, Math.floor(Number(binCount) || 10)));
  const rows = settledDecisions.map(item => {
    if (item?.status !== 'settled') throw new Error('all decisions must be settled outcomes');
    return {
      p: probability('meeting_probability', item.prediction?.prediction?.meeting_probability),
      y: binary(item.outcome?.meeting),
    };
  });

  if (rows.length === 0) {
    return freeze({
      schema_version: 'powerhouse.calibration-metrics.v1',
      sample_size: 0,
      brier_score: null,
      mean_predicted_probability: null,
      actual_positive_rate: null,
      false_positive_rate: null,
      false_negative_rate: null,
      true_positives: 0,
      false_positives: 0,
      true_negatives: 0,
      false_negatives: 0,
      calibration_bins: [],
    });
  }

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;
  for (const row of rows) {
    const predictedPositive = row.p >= threshold;
    if (predictedPositive && row.y === 1) tp += 1;
    else if (predictedPositive) fp += 1;
    else if (row.y === 1) fn += 1;
    else tn += 1;
  }

  const meanP = rows.reduce((sum, row) => sum + row.p, 0) / rows.length;
  const actualRate = rows.reduce((sum, row) => sum + row.y, 0) / rows.length;
  const brier = rows.reduce((sum, row) => sum + ((row.p - row.y) ** 2), 0) / rows.length;

  return freeze({
    schema_version: 'powerhouse.calibration-metrics.v1',
    sample_size: rows.length,
    brier_score: round(brier),
    mean_predicted_probability: round(meanP),
    actual_positive_rate: round(actualRate),
    false_positive_rate: fp + tn > 0 ? round(fp / (fp + tn)) : 0,
    false_negative_rate: fn + tp > 0 ? round(fn / (fn + tp)) : 0,
    true_positives: tp,
    false_positives: fp,
    true_negatives: tn,
    false_negatives: fn,
    calibration_bins: calibrationBins(rows, bins),
  });
}

export const REVENUE_CALIBRATION_CONTRACT = freeze({
  version: 'REVENUE-CALIBRATION-LOOP-v1',
  canonicalTruth: 'Company Graph / Canonical State',
  parallelTruthStore: false,
  loop: ['prediction', 'action', 'outcome', 'revenue', 'calibration', 'next_decision'],
  failClosed: [
    'no learning outcome without an originating immutable prediction',
    'no invalid probability can enter calibration',
    'revenue is measured against the value predicted before action',
    'all decision and outcome evidence remains traceable by decision_id',
  ],
});
