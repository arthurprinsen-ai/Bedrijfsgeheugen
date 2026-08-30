import test from 'node:test';
import assert from 'node:assert/strict';
import { explainDecision } from '../brain/observability/explain.mjs';

const decision = {
  id: 'decision-1',
  trace_id: 'trace-1',
  correlation_id: 'corr-1',
  decision: 'BUILD',
  lane: 'PRODUCT',
  score: 0.82,
  reasons: ['positive_expected_utility'],
  blocked_by: null,
  policy_version: 'policy-v3',
  algorithm_version: 'score-v2',
  evidence_refs: ['evidence-1'],
  alternatives: ['WATCH'],
  rejection_reasons: ['watch_rejected: utility_above_threshold'],
  expected_utility: 0.82,
  risk: 'LOW',
  autonomy_class: 'SAFE_AUTONOMOUS',
  confidence: 0.91,
  provenance: { source: 'brain' },
  prompt: 'must never leak',
  raw_payload: { secret: true }
};

const events = [
  { id: 'evidence-1', trace_id: 'trace-1', object_type: 'Evidence', confidence: 0.9, provenance: { source: 'analytics' }, raw_payload: { private: true } },
  { id: 'signal-1', trace_id: 'trace-1', object_type: 'Signal', confidence: 0.8, provenance: { source: 'evidence-1' } },
  { id: 'opp-1', trace_id: 'trace-1', object_type: 'Opportunity', confidence: 0.75, provenance: { source: 'signal-1' } },
  { id: 'decision-1', trace_id: 'trace-1', object_type: 'Decision' },
  { id: 'mission-1', trace_id: 'trace-1', object_type: 'Mission' },
  { id: 'outcome-1', trace_id: 'trace-1', object_type: 'Outcome' }
];

test('decision explanation is a metadata-only projection of existing decision and trace truth', () => {
  const explanation = explainDecision(decision, events);
  assert.equal(explanation.decision, 'BUILD');
  assert.equal(explanation.trace_id, 'trace-1');
  assert.equal(explanation.policy_version, 'policy-v3');
  assert.equal(explanation.algorithm_version, 'score-v2');
  assert.deepEqual(explanation.reasons, ['positive_expected_utility']);
  assert.deepEqual(explanation.evidence_refs, ['evidence-1']);
  assert.equal(explanation.trace.complete, true);
  assert.equal(explanation.attribution.Evidence[0].ref, 'evidence-1');
  assert.equal(explanation.attribution.Evidence[0].confidence, 0.9);
  assert.deepEqual(explanation.attribution.Evidence[0].provenance, { source: 'analytics' });
  assert.equal(JSON.stringify(explanation).includes('must never leak'), false);
  assert.equal(JSON.stringify(explanation).includes('secret'), false);
  assert.equal(JSON.stringify(explanation).includes('private'), false);
});

test('explanation fails closed without decision identity or trace identity', () => {
  assert.throws(() => explainDecision({ ...decision, id: '' }, events), /decision id/i);
  assert.throws(() => explainDecision({ ...decision, trace_id: '' }, events), /trace id/i);
});

test('missing trace stages stay explicitly incomplete and are never invented', () => {
  const explanation = explainDecision(decision, events.slice(0, 3));
  assert.equal(explanation.trace.complete, false);
  assert.deepEqual(explanation.trace.missing, ['Decision', 'Mission', 'Outcome']);
  assert.deepEqual(explanation.attribution.Decision, []);
  assert.deepEqual(explanation.attribution.Mission, []);
  assert.deepEqual(explanation.attribution.Outcome, []);
});

test('events from other traces cannot contaminate attribution', () => {
  const explanation = explainDecision(decision, [
    ...events,
    { id: 'evil', trace_id: 'other-trace', object_type: 'Evidence', confidence: 1, provenance: { source: 'wrong' } }
  ]);
  assert.equal(explanation.attribution.Evidence.some(item => item.ref === 'evil'), false);
});
