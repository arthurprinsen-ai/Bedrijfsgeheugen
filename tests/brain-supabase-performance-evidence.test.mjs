import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPerformanceEvidenceSnapshot,
  decidePerformanceTrendAction,
  evaluatePerformanceOutcome,
} from '../tools/supabase-performance-evidence.mjs';

test('performance evidence snapshot has a stable finding key and comparable measurements', () => {
  const snapshot = buildPerformanceEvidenceSnapshot({
    lint: 'unindexed_foreign_keys',
    schema: 'public',
    table: 'leden',
    findingName: 'leden_organisatie_id_fkey',
    observedAt: '2026-08-30T17:00:24.922Z',
    estimatedRows: 42,
    totalBytes: 65536,
    workload: { relevantQueries: 12, fkDeletePressure: false, p95Ms: 24 },
  });

  assert.equal(snapshot.findingKey, 'unindexed_foreign_keys|public|leden|leden_organisatie_id_fkey');
  assert.equal(snapshot.measuredAt, '2026-08-30T17:00:24.922Z');
  assert.deepEqual(snapshot.measurement, {
    estimatedRows: 42,
    totalBytes: 65536,
    relevantQueries: 12,
    fkDeletePressure: false,
    p95Ms: 24,
  });
});

test('one strong observation remains observation-only', () => {
  const action = decidePerformanceTrendAction({
    lint: 'unindexed_foreign_keys',
    observations: [
      { estimatedRows: 25000, totalBytes: 20 * 1024 * 1024, workload: { relevantQueries: 500, fkDeletePressure: true, p95Ms: 180 } },
    ],
  });

  assert.equal(action.action, 'OBSERVE');
  assert.equal(action.autoApply, false);
  assert.match(action.reason, /consecutive|repeated/i);
});

test('two consecutive strong observations may become a governed candidate index', () => {
  const action = decidePerformanceTrendAction({
    lint: 'unindexed_foreign_keys',
    observations: [
      { estimatedRows: 22000, totalBytes: 18 * 1024 * 1024, workload: { relevantQueries: 300, fkDeletePressure: true, p95Ms: 150 } },
      { estimatedRows: 26000, totalBytes: 22 * 1024 * 1024, workload: { relevantQueries: 450, fkDeletePressure: true, p95Ms: 170 } },
    ],
  });

  assert.equal(action.action, 'CANDIDATE_INDEX');
  assert.equal(action.autoApply, false);
  assert.equal(action.requiredConsecutiveEvidence, 2);
});

test('post-change outcome records improvement as positive learning', () => {
  const outcome = evaluatePerformanceOutcome({
    before: { p95Ms: 180, relevantQueries: 500 },
    after: { p95Ms: 90, relevantQueries: 500 },
  });

  assert.equal(outcome.state, 'VERIFIED_IMPROVEMENT');
  assert.equal(outcome.positiveLearning, true);
  assert.equal(outcome.p95ImprovementPct, 50);
});

test('post-change outcome records no measurable benefit as negative learning', () => {
  const outcome = evaluatePerformanceOutcome({
    before: { p95Ms: 180, relevantQueries: 500 },
    after: { p95Ms: 178, relevantQueries: 500 },
  });

  assert.equal(outcome.state, 'NO_MEASURABLE_BENEFIT');
  assert.equal(outcome.positiveLearning, false);
  assert.equal(outcome.autoRollback, false);
});
