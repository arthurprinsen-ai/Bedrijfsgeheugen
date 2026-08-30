import test from 'node:test';
import assert from 'node:assert/strict';
import { decideSupabasePerformanceAction } from '../tools/supabase-performance-governor.mjs';

test('small unindexed foreign key remains observation-only without workload evidence', () => {
  const decision = decideSupabasePerformanceAction({
    lint: 'unindexed_foreign_keys',
    level: 'INFO',
    estimatedRows: 20,
    totalBytes: 57344,
    workload: { relevantQueries: 0, fkDeletePressure: false, p95Ms: null }
  });
  assert.equal(decision.action, 'OBSERVE');
  assert.equal(decision.autoApply, false);
});

test('unindexed foreign key becomes a candidate only with scale and workload evidence', () => {
  const decision = decideSupabasePerformanceAction({
    lint: 'unindexed_foreign_keys',
    level: 'INFO',
    estimatedRows: 25000,
    totalBytes: 20 * 1024 * 1024,
    workload: { relevantQueries: 500, fkDeletePressure: true, p95Ms: 180 }
  });
  assert.equal(decision.action, 'CANDIDATE_INDEX');
  assert.equal(decision.autoApply, false);
  assert.match(decision.reason, /evidence/i);
});

test('unused index is never auto-dropped from a linter INFO alone', () => {
  const decision = decideSupabasePerformanceAction({
    lint: 'unused_index',
    level: 'INFO',
    estimatedRows: 100000,
    totalBytes: 100 * 1024 * 1024,
    workload: { indexScans: 0, observationDays: 30 }
  });
  assert.equal(decision.action, 'OBSERVE');
  assert.equal(decision.autoApply, false);
});

test('WARN and ERROR findings escalate but never mutate production directly', () => {
  for (const level of ['WARN', 'ERROR']) {
    const decision = decideSupabasePerformanceAction({ lint: 'advisor_finding', level, workload: {} });
    assert.equal(decision.action, 'INVESTIGATE');
    assert.equal(decision.autoApply, false);
  }
});
