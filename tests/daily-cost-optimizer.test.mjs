import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDailyCandidate, evaluateExperiment } from '../platform/cost/daily-optimizer.mjs';

test('selects at most one safe reversible candidate', () => {
  const result = selectDailyCandidate({
    alreadyStartedToday: 0,
    candidates: [
      { id: 'A', expectedSavings: 20, confidence: 0.9, reusability: 1, implementationCost: 1, risk: 1, reversible: true, evidence: ['delta'] },
      { id: 'B', expectedSavings: 50, confidence: 0.9, reusability: 1, implementationCost: 1, risk: 5, reversible: false, evidence: ['delta'] },
    ],
  });

  assert.equal(result.id, 'A');
});

test('does not start a second production experiment on the same day', () => {
  const result = selectDailyCandidate({
    alreadyStartedToday: 1,
    candidates: [{ id: 'A', expectedSavings: 20, confidence: 0.9, reusability: 1, implementationCost: 1, risk: 1, reversible: true, evidence: ['delta'] }],
  });

  assert.deepEqual(result, { decision: 'NO_SAFE_CANDIDATE', reason: 'DAILY_EXPERIMENT_LIMIT' });
});

test('keeps only lower normalized cost with protected metrics green', () => {
  const result = evaluateExperiment({
    before: { creditsPerVerifiedOutcome: 20, latencyMsPerVerifiedOutcome: 1_000 },
    after: { creditsPerVerifiedOutcome: 14, latencyMsPerVerifiedOutcome: 900 },
    regressionPassed: true,
    protectedMetricsGreen: true,
  });

  assert.equal(result.decision, 'KEEP');
});

test('rolls back a cheaper but regressed candidate', () => {
  const result = evaluateExperiment({
    before: { creditsPerVerifiedOutcome: 20, latencyMsPerVerifiedOutcome: 1_000 },
    after: { creditsPerVerifiedOutcome: 10, latencyMsPerVerifiedOutcome: 800 },
    regressionPassed: false,
    protectedMetricsGreen: false,
  });

  assert.equal(result.decision, 'ROLLBACK');
  assert.deepEqual(result.failedConditions, ['REGRESSION_FAILED', 'PROTECTED_METRIC_REGRESSION']);
});

test('rolls back when savings come with more than ten percent normalized latency regression', () => {
  const result = evaluateExperiment({
    before: { creditsPerVerifiedOutcome: 20, latencyMsPerVerifiedOutcome: 1_000 },
    after: { creditsPerVerifiedOutcome: 10, latencyMsPerVerifiedOutcome: 1_101 },
    regressionPassed: true,
    protectedMetricsGreen: true,
  });

  assert.equal(result.decision, 'ROLLBACK');
  assert.deepEqual(result.failedConditions, ['LATENCY_REGRESSION']);
});
