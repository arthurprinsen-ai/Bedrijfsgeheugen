import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyMakeBudget,
  classifyScenarioAnomaly,
} from '../tools/make-cost-governor-policy.mjs';

const MB = 1_000_000;

test('GREEN below 60 percent of safe daily allowance', () => {
  const r = classifyMakeBudget({
    usedBytes: 50 * MB,
    monthlyCapBytes: 5_000 * MB,
    monthUsedBytes: 1_000 * MB,
    dayOfMonth: 10,
    daysInMonth: 30,
    usedCredits: 100,
    monthlyCreditCap: 10_000,
    monthUsedCredits: 1_000,
  });
  assert.equal(r.zone, 'GREEN');
  assert.equal(r.actionPolicy, 'NORMAL');
});

test('AMBER at 60 to under 80 percent', () => {
  const r = classifyMakeBudget({
    usedBytes: 126 * MB,
    monthlyCapBytes: 5_000 * MB,
    monthUsedBytes: 800 * MB,
    dayOfMonth: 10,
    daysInMonth: 30,
    usedCredits: 100,
    monthlyCreditCap: 10_000,
    monthUsedCredits: 1_000,
  });
  assert.equal(r.zone, 'AMBER');
  assert.equal(r.actionPolicy, 'SHRINK_PAYLOADS');
});

test('RED at 80 to under 95 percent', () => {
  const r = classifyMakeBudget({
    usedBytes: 185 * MB,
    monthlyCapBytes: 5_000 * MB,
    monthUsedBytes: 800 * MB,
    dayOfMonth: 10,
    daysInMonth: 30,
    usedCredits: 100,
    monthlyCreditCap: 10_000,
    monthUsedCredits: 1_000,
  });
  assert.equal(r.zone, 'RED');
  assert.equal(r.actionPolicy, 'THROTTLE_NON_CRITICAL');
});

test('HARD at 95 percent or projected monthly exhaustion', () => {
  const threshold = classifyMakeBudget({
    usedBytes: 205 * MB,
    monthlyCapBytes: 5_000 * MB,
    monthUsedBytes: 800 * MB,
    dayOfMonth: 10,
    daysInMonth: 30,
    usedCredits: 100,
    monthlyCreditCap: 10_000,
    monthUsedCredits: 1_000,
  });
  assert.equal(threshold.zone, 'HARD');

  const projected = classifyMakeBudget({
    usedBytes: 100 * MB,
    monthlyCapBytes: 1_000 * MB,
    monthUsedBytes: 950 * MB,
    dayOfMonth: 15,
    daysInMonth: 30,
    usedCredits: 10,
    monthlyCreditCap: 10_000,
    monthUsedCredits: 1_000,
  });
  assert.equal(projected.zone, 'HARD');
  assert.equal(projected.projectedMonthExhaustion, true);
});

test('missing explicit monthly data cap fails closed', () => {
  assert.throws(() => classifyMakeBudget({
    usedBytes: 1,
    monthlyCapBytes: null,
    dayOfMonth: 1,
    daysInMonth: 30,
  }), /monthlyCapBytes/);
});

test('scenario anomaly fires at 2x own baseline', () => {
  const r = classifyScenarioAnomaly({
    bytesPerRun: 2_100_000,
    baselineBytesPerRun: 1_000_000,
    bytesPerOperation: 100_000,
    baselineBytesPerOperation: 100_000,
    dailyBytesDelta: 1_000_000,
    safeDailyAllowanceBytes: 100_000_000,
    zeroValueRuns: 0,
    criticality: 'STANDARD_OPERATIONAL',
  });
  assert.equal(r.anomalous, true);
  assert.equal(r.reason, 'BYTES_PER_RUN_2X_BASELINE');
});

test('critical traffic is preserved under RED while discretionary work throttles', () => {
  const critical = classifyScenarioAnomaly({
    bytesPerRun: 1,
    baselineBytesPerRun: 1,
    bytesPerOperation: 1,
    baselineBytesPerOperation: 1,
    dailyBytesDelta: 1,
    safeDailyAllowanceBytes: 100,
    zeroValueRuns: 0,
    criticality: 'CRITICAL_PUBLISHING',
    budgetZone: 'RED',
  });
  assert.equal(critical.degradation, 'PRESERVE');

  const discretionary = classifyScenarioAnomaly({
    bytesPerRun: 1,
    baselineBytesPerRun: 1,
    bytesPerOperation: 1,
    baselineBytesPerOperation: 1,
    dailyBytesDelta: 1,
    safeDailyAllowanceBytes: 100,
    zeroValueRuns: 0,
    criticality: 'DISCRETIONARY_ENRICHMENT',
    budgetZone: 'RED',
  });
  assert.equal(discretionary.degradation, 'THROTTLE');
});
