import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const path='supabase/migrations/20260918143000_powerhouse_control_plane_recovery_supervisor_v1.sql';

test('next action projection covers the canonical lifecycle', async()=>{
  const sql=await readFile(path,'utf8');
  for(const action of ['PLAN','DISPATCH','AWAIT_OR_WATCHDOG','RECONCILE','VERIFY','CLOSE','RECOVER_OR_COMPENSATE','NONE']){
    assert.match(sql,new RegExp(`'${action}'`));
  }
});

test('automatic replay requires proven no-side-effect readback', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/safe_replay=true/);
  assert.match(sql,/side_effect_state='NOT_STARTED'/);
  assert.match(sql,/readback_before_replay/);
  assert.match(sql,/REPLANNED_SAFE_REPLAY/);
});

test('started succeeded or unknown side effects fail closed', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/in \('STARTED','SUCCEEDED','UNKNOWN'\)/);
  assert.match(sql,/SIDE_EFFECT_STATE_NOT_SAFE_FOR_REPLAY/);
  assert.match(sql,/FAIL_CLOSED/);
});

test('recovery worker remains service-role only', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/revoke execute on function public\.powerhouse_reconciliation_worker_v2\(text,integer\) from public, anon, authenticated/i);
  assert.match(sql,/grant execute on function public\.powerhouse_reconciliation_worker_v2\(text,integer\) to service_role/i);
});
