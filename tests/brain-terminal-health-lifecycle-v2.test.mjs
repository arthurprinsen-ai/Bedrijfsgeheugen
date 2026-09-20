import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminal health v2 distinguishes retired proof from active truth', async () => {
  const sql = await readFile('supabase/migrations/20260920101200_terminal_health_lifecycle_v2.sql','utf8');
  assert.match(sql,/desired_state->>'lifecycle'/);
  assert.match(sql,/RETIRED/);
  assert.match(sql,/blocked_obligations/);
  assert.match(sql,/DRIFTED','UNKNOWN/);
  assert.match(sql,/HISTORICAL_TIMEBOXED_PROOF_EXPIRED/);
  assert.doesNotMatch(sql,/insert\s+into\s+public\.brain_observed_states/i);
});

test('terminal health v2 compensates only old selftests proven never dispatched', async () => {
  const sql = await readFile('supabase/migrations/20260920101200_terminal_health_lifecycle_v2.sql','utf8');
  assert.match(sql,/job_key like 'selftest-%'/);
  assert.match(sql,/dispatch_generation=0/);
  assert.match(sql,/remote_ref is null/);
  assert.match(sql,/'COMPENSATED'/);
  assert.match(sql,/HISTORICAL_SELFTEST_NEVER_DISPATCHED/);
  assert.match(sql,/o\.status in \('VERIFIED','COMPENSATED'\)/);
});
