import test from 'node:test';
import assert from 'node:assert/strict';
import { createProjection, applyProjectionDelta } from '../platform/read-models/projector.mjs';
import { createManagementSummaryView } from '../platform/read-models/management-summary.mjs';

test('read model exposes freshness metadata and advances only with newer source state', () => {
  const base = createProjection({ name: 'BusinessHealthView', generatedAt: '2026-08-29T10:00:00Z', sourceStateVersion: 4, data: { score: 72 } });
  const next = applyProjectionDelta(base, { generatedAt: '2026-08-29T10:01:00Z', sourceStateVersion: 5, patch: { score: 73 } });
  assert.equal(next.data.score, 73);
  assert.equal(next.sourceStateVersion, 5);
  assert.throws(() => applyProjectionDelta(next, { sourceStateVersion: 5, patch: {} }), /advance/i);
});

test('management summary surfaces only permitted material event classes and limits attention budget', () => {
  const items = [
    { id: '1', type: 'RiskEscalated', relevance: 1, impact: 1, urgency: 1, confidence: 1, responsibility: 1, novelty: 1, permitted: true },
    { id: '2', type: 'OpportunityCreated', relevance: .8, impact: .9, urgency: .4, confidence: .8, responsibility: 1, novelty: .7, permitted: true },
    { id: '3', type: 'UnimportantDatabaseWrite', relevance: 1, impact: 1, urgency: 1, confidence: 1, responsibility: 1, novelty: 1, permitted: true },
    { id: '4', type: 'TrustIssue', relevance: 1, impact: 1, urgency: 1, confidence: 1, responsibility: 1, novelty: 1, permitted: false },
  ];
  const view = createManagementSummaryView({ sourceStateVersion: 10, companyHealth: 72, items });
  assert.deepEqual(view.data.attention.map(x => x.id), ['1', '2']);
  assert.equal(view.data.companyHealth, 72);
});

test('read model can explicitly carry last-known-good stale state', () => {
  const view = createProjection({ name: 'IntegrationHealthView', sourceStateVersion: 8, stale: true, data: { lastVerifiedAt: '2026-08-28T23:58:00Z' } });
  assert.equal(view.stale, true);
  assert.equal(view.data.lastVerifiedAt, '2026-08-28T23:58:00Z');
});
