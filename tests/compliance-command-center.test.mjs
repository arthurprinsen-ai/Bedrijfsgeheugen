import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canonicalFramework,
  evaluateControl,
  evaluatePortfolio,
  rankRisks,
  createAuditSnapshot
} from '../portal-next/compliance-engine.js';

const NOW = new Date('2026-09-08T12:00:00Z');

function baseControl(overrides = {}) {
  return {
    id: 'CTRL-1',
    framework: 'EU_AI_ACT',
    requirement: 'Test requirement',
    applicability: 'applicable',
    control: { implemented: true },
    evidence: [{ id: 'EV-1', label: 'Evidence', verified: true }],
    severity: 'medium',
    owner: 'Governance',
    reason: 'Required for test',
    nextAction: 'Maintain evidence',
    sourceKeys: [],
    verifiedAt: '2026-09-08T10:00:00Z',
    ...overrides
  };
}

test('VERIFIED requires both current evidence and verifiedAt', () => {
  assert.equal(evaluateControl(baseControl(), { now: NOW }).status, 'VERIFIED');
  assert.equal(evaluateControl(baseControl({ evidence: [] }), { now: NOW }).status, 'EVIDENCE_MISSING');
  assert.equal(evaluateControl(baseControl({ verifiedAt: null }), { now: NOW }).status, 'EVIDENCE_MISSING');
});

test('unknown applicability remains UNKNOWN instead of false non-compliance', () => {
  const result = evaluateControl(baseControl({ applicability: 'unknown', control: null, evidence: [], verifiedAt: null }), { now: NOW });
  assert.equal(result.status, 'UNKNOWN');
});

test('legacy NIS and Wbni map to NIS2/Cbw for aggregation', () => {
  assert.equal(canonicalFramework('NIS'), 'NIS2_CBW');
  assert.equal(canonicalFramework('WBNI'), 'NIS2_CBW');
  assert.equal(canonicalFramework('NIS2_CBW'), 'NIS2_CBW');
});

test('portfolio does not double-count the same legacy/canonical requirement', () => {
  const controls = [
    baseControl({ id: 'NIS-RISK', framework: 'NIS', requirement: 'Risk management' }),
    baseControl({ id: 'NIS-RISK', framework: 'NIS2_CBW', requirement: 'Risk management' })
  ];
  const result = evaluatePortfolio(controls, { now: NOW, scope: 'customer' });
  assert.equal(result.controls.length, 1);
  assert.equal(result.frameworks.NIS2_CBW.total, 1);
});

test('risk ranking prioritises critical missing controls before low evidence gaps', () => {
  const critical = baseControl({ id: 'CRIT', severity: 'critical', control: null, evidence: [], verifiedAt: null });
  const lowEvidence = baseControl({ id: 'LOW', severity: 'low', evidence: [], verifiedAt: null });
  const ranked = rankRisks([critical, lowEvidence], { now: NOW });
  assert.deepEqual(ranked.map(item => item.id), ['CRIT', 'LOW']);
});

test('audit snapshot contains scope timestamp framework status findings and evidence index', () => {
  const controls = [
    baseControl(),
    baseControl({ id: 'MISS', severity: 'high', control: null, evidence: [], verifiedAt: null, nextAction: 'Implement control' })
  ];
  const snapshot = createAuditSnapshot(controls, { now: NOW, scope: 'bedrijfsgeheugen' });
  assert.equal(snapshot.scope, 'bedrijfsgeheugen');
  assert.equal(snapshot.timestamp, NOW.toISOString());
  assert.ok(snapshot.frameworks.EU_AI_ACT);
  assert.ok(snapshot.findings.some(item => item.id === 'MISS'));
  assert.ok(snapshot.evidenceIndex.some(item => item.controlId === 'CTRL-1'));
});
