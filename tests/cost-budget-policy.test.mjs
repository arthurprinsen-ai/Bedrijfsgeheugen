import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBudget } from '../platform/cost/budget-policy.mjs';

test('uses remaining credits over remaining Amsterdam calendar days', () => {
  const result = evaluateBudget({
    monthlyLimit: 10_000,
    usedCredits: 6_000,
    now: '2026-08-20T08:00:00+02:00',
    workClass: 'research',
    protectedInterrupt: false,
  });

  assert.equal(result.remainingCredits, 4_000);
  assert.equal(result.dailyAllowance, 4_000 / 12);
});

test('exhausted budget defers optional work', () => {
  const result = evaluateBudget({
    monthlyLimit: 10_000,
    usedCredits: 10_001,
    now: '2026-08-30T08:00:00+02:00',
    workClass: 'creative',
    protectedInterrupt: false,
  });

  assert.equal(result.decision, 'BUDGET_DEFERRED');
});

test('protected security interrupt remains runnable', () => {
  const result = evaluateBudget({
    monthlyLimit: 10_000,
    usedCredits: 10_001,
    now: '2026-08-30T08:00:00+02:00',
    workClass: 'security',
    protectedInterrupt: true,
  });

  assert.equal(result.decision, 'PROTECTED_INTERRUPT');
});

test('rejects malformed or negative budget inputs', () => {
  assert.throws(() => evaluateBudget({
    monthlyLimit: 0,
    usedCredits: -1,
    now: 'not-a-date',
    workClass: 'research',
    protectedInterrupt: false,
  }), /valid monthly budget input/);
});
