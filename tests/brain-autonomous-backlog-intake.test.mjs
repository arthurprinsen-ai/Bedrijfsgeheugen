import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeBacklog, classifyBacklogItem } from '../scripts/brain/continuous-improvement/backlog-intake.mjs';

test('stale Make obligation is reconciled to current Supabase/Brain authority without executing Make', () => {
  const result = classifyBacklogItem({
    id: 'open-loop-bg168-make',
    kind: 'obligation',
    component: 'brain-writeback',
    problemClass: 'runtime-writeback-authority',
    changeClass: 'authority-reconciliation',
    stale: true,
    retiredAuthority: 'Make/BG168',
    replacementAuthority: 'Supabase/Brain canonical writer'
  });
  assert.equal(result.classification, 'SUPERSEDED');
  assert.equal(result.decision, 'HOLD_RECONCILE');
  assert.equal(result.reconciliation.destructive_execution_allowed, false);
  assert.equal(result.reconciliation.to, 'Supabase/Brain canonical writer');
});

test('dependency majors fail closed until compatibility security and correctness evidence exist', () => {
  const result = classifyBacklogItem({
    id: 'dependabot-actions-checkout-v7',
    kind: 'dependency',
    component: 'github-actions',
    problemClass: 'technology-currency',
    changeClass: 'major-upgrade',
    baselineComparable: false,
    criticalEvidence: { security: false, correctness: false },
    productionPromotion: true,
    nonCriticalEvidenceComplete: false
  });
  assert.equal(result.classification, 'CANDIDATE_REQUIRED');
  assert.equal(result.decision, 'REJECT');
  assert.equal(result.fail_closed, true);
});

test('historical duplicate PR delta coalesces with an active canonical candidate', () => {
  const active = [{
    id: '1774', kind: 'pull_request', component: 'engineering-os-learning', problemClass: 'closed-loop-runtime',
    changeClass: 'reconciliation', scope: 'global', evidenceCluster: ['scorecard','flake','dependency']
  }];
  const result = classifyBacklogItem({
    id: '1744', kind: 'pull_request', component: 'engineering-os-learning', problemClass: 'closed-loop-runtime',
    changeClass: 'reconciliation', scope: 'global', evidenceCluster: ['dependency','flake','scorecard'],
    criticalEvidence: { security: true, correctness: true }, baselineComparable: true, nonCriticalEvidenceComplete: true
  }, active);
  assert.equal(result.classification, 'COALESCE');
});

test('consumer returns explicit classification counts and never allows destructive execution', () => {
  const packet = consumeBacklog({
    items: [
      { id: 'stale', kind: 'obligation', component: 'writeback', problemClass: 'authority', stale: true, retiredAuthority: 'Make', replacementAuthority: 'Supabase/Brain' },
      { id: 'dep', kind: 'dependency', component: 'actions/setup-python', problemClass: 'technology-currency', criticalEvidence: { security: false, correctness: false }, baselineComparable: false }
    ]
  });
  assert.equal(packet.results.length, 2);
  assert.equal(packet.counts.SUPERSEDED, 1);
  assert.equal(packet.counts.CANDIDATE_REQUIRED, 1);
  assert.equal(packet.destructive_execution_allowed, false);
  assert.equal(packet.classification_authority, 'powerhouse-continuous-improvement-engine-v1');
});
