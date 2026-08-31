import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration='supabase/migrations/20260831_brain_transition_rpc_local_alias_cas.sql';

test('transition RPCs bind parameters to typed locals before locked-row CAS',()=>{
  assert.equal(fs.existsSync(migration),true,'transition RPC CAS fix migration must exist');
  const sql=fs.readFileSync(migration,'utf8');
  for (const required of [
    'v_operation_id uuid := p_operation_id',
    'v_expected_version bigint := p_expected_version',
    'v_obligation_id uuid := p_obligation_id',
    'select * into v_current',
    'for update',
    'STATE_VERSION_CONFLICT',
    'brain_transition_operation',
    'brain_transition_obligation'
  ]) assert.match(sql,new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),`missing ${required}`);
});
