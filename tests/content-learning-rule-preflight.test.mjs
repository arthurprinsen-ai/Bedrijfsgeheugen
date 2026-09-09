import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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

function assertWriterPreflight(path, label) {
  const workflow = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  const preflight = workflow.indexOf('CONTENT_RULE_CONTEXT_JSON');
  const writer = workflow.indexOf('uses: anthropics/claude-code-action@v1');
  assert.ok(preflight >= 0, `${label} must load and validate CONTENT_RULE_CONTEXT_JSON`);
  assert.ok(writer >= 0, `${label} Claude writer step must remain present`);
  assert.ok(preflight < writer, `${label} rule preflight must run before Claude`);
  assert.match(workflow, /CONTENT_RULE_CONTEXT_JSON[\s\S]*positive_rules/);
  assert.match(workflow, /CONTENT_RULE_CONTEXT_JSON[\s\S]*avoid_rules/);
  assert.match(workflow, /CONTENT_RULE_CONTEXT_JSON[\s\S]*experiment_allocation/);
  assert.match(workflow, /CONTENT_RULE_CONTEXT_JSON[\s\S]*\$\{\{ steps\.rule_context\.outputs\.context \}\}/);
}

test('active AI blog update writer fails closed on rule context before Claude receives a prompt', () => {
  assertWriterPreflight('../.github/workflows/blog-bijwerken.yml', 'blog update writer');
});

test('native daily blog writer fails closed on rule context before Claude receives a prompt', () => {
  assertWriterPreflight('../.github/workflows/native-approved-blog-supply.yml', 'native blog writer');
});
