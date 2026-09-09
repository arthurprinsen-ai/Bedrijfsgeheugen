import test from 'node:test';
import assert from 'node:assert/strict';
import { requireRuleContext } from '../lib/content-learning/rule-preflight.mjs';

test('accepts a fresh bounded rule snapshot', async () => {
  const context = await requireRuleContext(async () => ({
    snapshot_id: 'rules-1',
    generated_at: '2026-09-09T17:00:00.000Z',
    expires_at: '2026-09-10T17:00:00.000Z',
    positive_rules: [{ id: 'r1', rule: 'prefer proof-led hooks', evidence_count: 12, confidence: 0.84 }],
    avoid_rules: [],
    experiment_allocation: 0.2,
    winners: [{ hook_type: 'proof' }],
    losers: [],
  }), { now: new Date('2026-09-09T18:00:00.000Z') });
  assert.equal(context.snapshot_id, 'rules-1');
  assert.equal(context.experiment_allocation, 0.2);
});

test('fails closed when rules are missing', async () => {
  await assert.rejects(() => requireRuleContext(async () => null), /CONTENT_RULE_CONTEXT_UNAVAILABLE/);
});

test('fails closed when rules are stale', async () => {
  await assert.rejects(() => requireRuleContext(async () => ({ snapshot_id: 'old', expires_at: '2026-09-09T17:00:00.000Z' }), { now: new Date('2026-09-09T18:00:00.000Z') }), /CONTENT_RULE_CONTEXT_STALE/);
});
