import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const path='supabase/migrations/20260918143500_powerhouse_control_plane_generic_recovery_v1.sql';

test('new operations are recovery-aware by default', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/execution_resilience/);
  assert.match(sql,/'side_effect_state','NOT_STARTED'/);
  assert.match(sql,/'readback_before_replay',true/);
  assert.match(sql,/'last_heartbeat_at',clock_timestamp\(\)/);
});

test('generic recovery re-plans only after no-side-effect readback', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/v_operation\.status='RESULT_UNKNOWN'/);
  assert.match(sql,/side_effect_state'='NOT_STARTED'/);
  assert.match(sql,/readback_before_replay/);
  assert.match(sql,/'PLANNED'/);
  assert.match(sql,/v_operation\.dispatch_generation \+ 1/);
  assert.match(sql,/'REPLANNED_SAFE'/);
  assert.match(sql,/'NO_SIDE_EFFECT_STARTED'/);
});

test('unknown side-effect state still fails closed', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/NO_SAFE_CANONICAL_RECOVERY_HANDLER/);
  assert.match(sql,/'FAIL_CLOSED'/);
});

test('next-action projection is derived from canonical operation state', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/create or replace view public\.powerhouse_control_plane_next_action_v1/);
  for(const action of ['DISPATCH','READBACK','VERIFY','RECONCILE','READBACK_BEFORE_REPLAY','REVIEW_FAILURE','NONE']){
    assert.match(sql,new RegExp(`'${action}'`));
  }
  assert.match(sql,/security_invoker = true/);
  assert.match(sql,/revoke all on public\.powerhouse_control_plane_next_action_v1 from public, anon, authenticated/);
});
