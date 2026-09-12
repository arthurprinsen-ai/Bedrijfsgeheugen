import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSelectionRecord, reconcileLearningApplications } from '../tools/content-growth/selection-audit.mjs';

test('selection record preserves exactly which proven revenue learnings drove the choice', () => {
  const record = buildSelectionRecord({
    date: '2026-09-13',
    selected: { content_id: 'blog:ai-automatisering-mkb', slug: 'ai-automatisering-mkb', score: 8.4, applied_revenue_learning_ids: ['rev-2','rev-1','rev-1'] },
    mode: 'brain_learning',
  });
  assert.equal(record.state, 'selected');
  assert.deepEqual(record.applied_revenue_learning_ids, ['rev-1','rev-2']);
  assert.equal(record.learning_decision_id, 'content:2026-09-13:blog:ai-automatisering-mkb');
});

test('reconciler idempotently writes a decision and one application per learning', async () => {
  const calls = { decisions: [], applications: [] };
  const store = {
    recordDecision: async x => calls.decisions.push(x),
    recordApplication: async x => calls.applications.push(x),
  };
  const ledger = { version: 1, days: {
    '2026-09-13': {
      date: '2026-09-13', content_id: 'blog:ai-automatisering-mkb', slug: 'ai-automatisering-mkb', state: 'live',
      learning_decision_id: 'content:2026-09-13:blog:ai-automatisering-mkb', applied_revenue_learning_ids: ['rev-1','rev-2']
    }
  }};
  const out = await reconcileLearningApplications({ ledger, store, now: new Date('2026-09-13T12:00:00Z') });
  assert.equal(out.decisions, 1);
  assert.equal(out.applications, 2);
  assert.equal(calls.applications[0].decisionId, 'content:2026-09-13:blog:ai-automatisering-mkb');
  assert.equal(calls.applications[0].verificationStatus, 'PENDING');
});
