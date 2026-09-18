import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const path='supabase/migrations/20260918141000_powerhouse_control_plane_monotonic_terminal_v1.sql';

test('terminal operation truth cannot be reopened', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/v_current\.status='VERIFIED' and p_status<>'VERIFIED'/);
  assert.match(sql,/TERMINAL_STATE_REOPEN_FORBIDDEN:VERIFIED/);
  assert.match(sql,/v_current\.status='COMPENSATED' and p_status<>'COMPENSATED'/);
  assert.match(sql,/TERMINAL_STATE_REOPEN_FORBIDDEN:COMPENSATED/);
});

test('terminal obligation truth cannot be reopened', async()=>{
  const sql=await readFile(path,'utf8');
  for(const state of ['FULFILLED','CANCELLED','BREACHED']){
    assert.match(sql,new RegExp(`v_current\\.state='${state}' and p_state<>'${state}'`));
    assert.match(sql,new RegExp(`TERMINAL_STATE_REOPEN_FORBIDDEN:${state}`));
  }
});

test('same terminal state replay remains available for durable evidence refresh', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/p_status<>'VERIFIED'/);
  assert.match(sql,/p_state<>'FULFILLED'/);
  assert.match(sql,/evidence=coalesce\(p_evidence,evidence\)/);
  assert.match(sql,/evidence=coalesce\(p_evidence,bo\.evidence\)/);
});

test('existing optimistic concurrency and control-plane admission remain enforced', async()=>{
  const sql=await readFile(path,'utf8');
  assert.match(sql,/CONTROL_PLANE_BINDING_REQUIRED/);
  assert.match(sql,/STATE_VERSION_CONFLICT/);
  assert.match(sql,/for update/i);
});
