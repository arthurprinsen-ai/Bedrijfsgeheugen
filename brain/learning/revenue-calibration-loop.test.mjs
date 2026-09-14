import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createDecisionPrediction,
  settleDecisionOutcome,
  calculateCalibrationMetrics,
  REVENUE_CALIBRATION_CONTRACT,
} from './revenue-calibration-loop.mjs';

const at = '2026-09-14T14:00:00.000Z';

function prediction(overrides = {}) {
  return createDecisionPrediction({
    decisionId: 'decision:acme:2026-09-14',
    entityId: 'company:acme',
    opportunityScore: 87,
    confidence: 0.83,
    meetingProbability: 0.21,
    expectedCommercialValue: 2900,
    recommendedAction: { type: 'personal_linkedin_then_email', priority: 'high' },
    evidenceRefs: ['signal:website-intent', 'signal:leadership-change'],
    modelVersion: 'opportunity-score-v1',
    predictedAt: at,
    ...overrides,
  });
}

test('captures the exact pre-action prediction as immutable evidence for later learning', () => {
  const item = prediction();
  assert.equal(item.schema_version, 'powerhouse.decision-prediction.v1');
  assert.equal(item.decision_id, 'decision:acme:2026-09-14');
  assert.equal(item.entity_id, 'company:acme');
  assert.equal(item.prediction.meeting_probability, 0.21);
  assert.equal(item.prediction.opportunity_score, 87);
  assert.equal(item.prediction.expected_commercial_value, 2900);
  assert.deepEqual(item.evidence_refs, ['signal:website-intent', 'signal:leadership-change']);
  assert.equal(item.status, 'open');
  assert.ok(Object.isFrozen(item));
});

test('settles a prediction against meeting, proposal, order and revenue outcomes without rewriting the original prediction', () => {
  const item = prediction();
  const settled = settleDecisionOutcome({
    prediction: item,
    outcome: {
      meeting: true,
      proposal: true,
      order: true,
      revenue: 2900,
      actionExecuted: true,
      occurredAt: '2026-09-16T09:00:00.000Z',
      evidenceRefs: ['crm:deal-42'],
    },
  });
  assert.equal(settled.prediction.status, 'open');
  assert.equal(settled.outcome.meeting, 1);
  assert.equal(settled.outcome.order, 1);
  assert.equal(settled.outcome.revenue, 2900);
  assert.equal(settled.learning.meeting_brier_score, 0.6241);
  assert.equal(settled.learning.revenue_error, 0);
  assert.equal(settled.status, 'settled');
});

test('calculates calibration, brier score and classification quality over multiple real outcomes', () => {
  const settled = [
    settleDecisionOutcome({ prediction: prediction({ decisionId: 'd1', meetingProbability: 0.8 }), outcome: { meeting: true, actionExecuted: true } }),
    settleDecisionOutcome({ prediction: prediction({ decisionId: 'd2', meetingProbability: 0.7 }), outcome: { meeting: false, actionExecuted: true } }),
    settleDecisionOutcome({ prediction: prediction({ decisionId: 'd3', meetingProbability: 0.2 }), outcome: { meeting: false, actionExecuted: true } }),
    settleDecisionOutcome({ prediction: prediction({ decisionId: 'd4', meetingProbability: 0.6 }), outcome: { meeting: true, actionExecuted: true } }),
  ];
  const metrics = calculateCalibrationMetrics({ settledDecisions: settled, positiveThreshold: 0.5 });
  assert.equal(metrics.sample_size, 4);
  assert.equal(metrics.actual_positive_rate, 0.5);
  assert.equal(metrics.mean_predicted_probability, 0.575);
  assert.equal(metrics.brier_score, 0.1825);
  assert.equal(metrics.false_positive_rate, 0.5);
  assert.equal(metrics.false_negative_rate, 0);
  assert.equal(metrics.true_positives, 2);
  assert.equal(metrics.false_positives, 1);
  assert.equal(metrics.true_negatives, 1);
  assert.equal(metrics.false_negatives, 0);
  assert.ok(Array.isArray(metrics.calibration_bins));
});

test('fails closed for invalid probabilities and prevents outcomes from being settled without an originating prediction', () => {
  assert.throws(() => prediction({ meetingProbability: 1.2 }), /meetingProbability/);
  assert.throws(() => settleDecisionOutcome({ prediction: null, outcome: { meeting: true } }), /prediction/);
});

test('contract binds decisions to execution, outcome, revenue and calibration instead of creating a parallel truth store', () => {
  assert.equal(REVENUE_CALIBRATION_CONTRACT.canonicalTruth, 'Company Graph / Canonical State');
  assert.equal(REVENUE_CALIBRATION_CONTRACT.parallelTruthStore, false);
  assert.deepEqual(REVENUE_CALIBRATION_CONTRACT.loop, ['prediction', 'action', 'outcome', 'revenue', 'calibration', 'next_decision']);
});
