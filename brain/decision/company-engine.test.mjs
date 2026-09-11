import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEvidence,
  normalizeCandidate,
  buildDecision,
  rankCompanyPortfolio
} from './company-engine.mjs';

test('normalizes evidence with explicit provenance and bounded confidence', () => {
  const evidence = normalizeEvidence({
    evidence_id: 'ev-1', tenant_id: 'tenant-a', subject_id: 'process-1',
    source_type: 'external', source_ref: 'CBS', observed_at: '2026-09-11T06:00:00Z',
    source_date: '2026-09-01', valid_until: '2026-10-01', freshness: 1.2,
    confidence: 0.8, quality: 0.9, verified: true, value: 7.2, unit: '%'
  });
  assert.equal(evidence.evidence_id, 'ev-1');
  assert.equal(evidence.freshness, 1);
  assert.equal(evidence.confidence, 0.8);
  assert.equal(evidence.verified, true);
  assert.deepEqual(evidence.provenance_chain, ['CBS']);
});

test('normalizes a candidate into the existing score/policy contract', () => {
  const candidate = normalizeCandidate({
    candidate_id: 'c-1', tenant_id: 'tenant-a', title: 'Automatiseer factuurverwerking',
    action: 'Bouw workflow', type: 'PRODUCT', expected_value: 50000,
    success_probability: 0.8, confidence: 0.8, evidence_quality: 0.9,
    evidence_freshness: 0.9, urgency: 0.7, strategic_fit: 0.9,
    learning_value: 0.4, reusability: 0.7, cost: 10000,
    opportunity_cost: 2000, risk: 0.2, time: 30, dependencies: []
  });
  assert.equal(candidate.candidate_id, 'c-1');
  assert.equal(candidate.expected_value, 50000);
  assert.equal(candidate.dependencies.length, 0);
  assert.equal(candidate.budget_ok, true);
});

test('orders prerequisites before dependent work even when dependent has higher raw value', () => {
  const portfolio = rankCompanyPortfolio([
    {
      candidate_id: 'foundation', type: 'PRODUCT', title: 'Datakwaliteit herstellen', action: 'Fix',
      expected_value: 10000, success_probability: .9, confidence: .9, evidence_quality: .9,
      evidence_freshness: .9, urgency: .8, strategic_fit: .9, cost: 1000, risk: .1, time: 5,
      dependencies: []
    },
    {
      candidate_id: 'automation', type: 'PRODUCT', title: 'AI automatisering', action: 'Build',
      expected_value: 100000, success_probability: .9, confidence: .9, evidence_quality: .9,
      evidence_freshness: .9, urgency: .9, strategic_fit: .9, cost: 1000, risk: .1, time: 5,
      dependencies: ['foundation']
    }
  ]);
  assert.equal(portfolio[0].candidate_id, 'foundation');
  assert.equal(portfolio[1].candidate_id, 'automation');
  assert.equal(portfolio[0].portfolio_bucket, 'NOW');
  assert.equal(portfolio[1].portfolio_bucket, 'NEXT');
});

test('fails closed on dependency cycles and exposes a machine-readable blocker', () => {
  const portfolio = rankCompanyPortfolio([
    { candidate_id: 'a', type: 'PRODUCT', title: 'A', action: 'A', expected_value: 100,
      success_probability: .8, confidence: .8, evidence_quality: .8, evidence_freshness: .8,
      urgency: .8, strategic_fit: .8, cost: 10, risk: .1, time: 1, dependencies: ['b'] },
    { candidate_id: 'b', type: 'PRODUCT', title: 'B', action: 'B', expected_value: 100,
      success_probability: .8, confidence: .8, evidence_quality: .8, evidence_freshness: .8,
      urgency: .8, strategic_fit: .8, cost: 10, risk: .1, time: 1, dependencies: ['a'] }
  ]);
  assert.equal(portfolio.every(x => x.blocked_by === 'DEPENDENCY_CYCLE'), true);
  assert.equal(portfolio.every(x => x.portfolio_bucket === 'DO_NOT_DO'), true);
});

test('buildDecision keeps economics, approval and audit metadata visible', () => {
  const decision = buildDecision({
    candidate_id: 'c-2', tenant_id: 'tenant-a', title: 'Proces versnellen', action: 'Start',
    type: 'PRODUCT', expected_value: 25000, cost: 5000, success_probability: .8,
    confidence: .8, evidence_quality: .9, evidence_freshness: .9, urgency: .6,
    strategic_fit: .9, risk: .2, time: 20, dependencies: [], owner: 'Finance',
    approval_state: 'PENDING', created_by: 'user:arthur'
  }, { now: '2026-09-11T06:30:00Z' });
  assert.equal(decision.investment, 5000);
  assert.equal(decision.expected_value, 25000);
  assert.equal(decision.approval_state, 'PENDING');
  assert.equal(decision.created_by, 'user:arthur');
  assert.match(decision.dedupe_key, /^company-decision:/);
  assert.ok(['NOW','NEXT','LATER','DO_NOT_DO'].includes(decision.portfolio_bucket));
});
