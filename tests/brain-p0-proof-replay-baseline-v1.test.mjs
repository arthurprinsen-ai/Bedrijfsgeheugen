import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260920101150_p0_proof_replay_baseline_v1.sql','utf8');

test('P0 replay baseline reconstructs only the proven historical desired state',()=>{
  assert.match(sql,/"mode":"ACTIVE","healthy":true/);
  assert.match(sql,/'artifact-v1'/);
  assert.match(sql,/brain_register_desired_state/);
  assert.match(sql,/\n\s*0\n\s*\)/);
});

test('P0 replay baseline preserves already retired production state',()=>{
  assert.match(sql,/v_row\.version=2/);
  assert.match(sql,/HISTORICAL_TIMEBOXED_PROOF_EXPIRED/);
  assert.match(sql,/production-truth-proof-20260831-v1-retired/);
});

test('P0 replay baseline fails closed on unknown drift',()=>{
  assert.match(sql,/P0_PROOF_REPLAY_BASELINE_DRIFT/);
});
