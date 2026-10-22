import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clusterBrainFailures } from '../tools/delivery/brain-failure-clustering.mjs';

test('one complete failure list is grouped without deleting cases', () => {
  const tap = [
    "# Error: ENOENT: no such file or directory, open 'supabase/migrations/20260918113000_contract.sql'",
    "#   code: 'ENOENT'",
    "not ok 11 - tests/supabase-contract.test.mjs",
    "  failureType: 'testCodeFailure'",
    "not ok 12 - current decision engine expectation",
    "  error: 'Expected values to be strictly equal:'",
    "  code: 'ERR_ASSERTION'",
    "not ok 13 - direct source guard",
    "  error: 'Expected values to be strictly equal:'",
    "  code: 'ERR_ASSERTION'",
    "# tests 20",
    "# fail 3",
  ].join('\n');
  const report = clusterBrainFailures(tap, {headSha: 'a'.repeat(40),runId:'4567'});
  assert.equal(report.reported_failures, 3);
  assert.equal(report.extracted_failures, 3);
  assert.equal(report.coverage_complete, true);
  assert.equal(report.categories.reduce((n, x) => n + x.count, 0), 3);
  assert.equal(report.status, 'OBSERVED_NOT_REPAIRED');
  assert.equal(report.requires_exact_head_zero_failure_rerun, true);
  assert.ok(report.categories.some(g => g.category === 'MISSING_EXECUTABLE_SQL_SOURCE'));
});

test('missing TAP summary and truncated proof never declare coverage', () => {
  const a = clusterBrainFailures('not ok 1 - something failed');
  const b = clusterBrainFailures('not ok 1 - one\n# fail 2');
  assert.equal(a.coverage_complete, false);
  assert.equal(b.coverage_complete, false);
  assert.equal(b.extracted_failures, 1);
});

test('tokens and email addresses are redacted; fingerprints stable across runs', () => {
  const input = 'not ok 1 - token=supersecret contact somebody@example.org\n# fail 1';
  const a=clusterBrainFailures(input,{runId:'1',headSha:'a'.repeat(40)});
  const b=clusterBrainFailures(input,{runId:'2',headSha:'b'.repeat(40)});
  assert.equal(a.categories[0].distinct_test_fingerprints[0],b.categories[0].distinct_test_fingerprints[0]);
  assert.doesNotMatch(JSON.stringify(a),/supersecret|somebody@example.org/);
});

test('Unified BRAIN preserves its original tests, lane failure and learning routing', () => {
  const s = readFileSync('.github/workflows/unified-brain-delivery.yml','utf8');
  assert.match(s,/Capture failed lane as Brain learning evidence/);
  assert.match(s,/createObservedFailure/);
  assert.match(s,/routeObservedFailureToLearning/);
  assert.match(s,/clusterBrainFailures/);
  assert.match(s,/delivery-failure-clusters-\$\{process\.env\.LANE\}\.json/);
  assert.match(s,/\.artifacts\/delivery-failure-clusters-\$\{\{ matrix\.id \}\}\.json/);
  assert.match(s,/node --test tests\/brain-\*\.test\.mjs/);
  assert.doesNotMatch(s,/skipBRAIN|skipBackend|allowFailures|continue-on-error:\s*true/);
});
