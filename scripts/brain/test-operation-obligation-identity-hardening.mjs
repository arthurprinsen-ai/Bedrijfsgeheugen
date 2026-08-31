import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration='supabase/migrations/20260831_brain_operation_obligation_identity_hardening.sql';

test('operations and obligations protect immutable identity and use CAS transitions',()=>{
  assert.equal(fs.existsSync(migration),true,'hardening migration must exist');
  const sql=fs.readFileSync(migration,'utf8');
  for(const required of [
    'brain_guard_operation_identity','brain_transition_operation','STATE_VERSION_CONFLICT',
    'brain_guard_obligation_identity','brain_transition_obligation',
    'OPERATION_IDENTITY_IMMUTABLE','OBLIGATION_IDENTITY_IMMUTABLE','security definer'
  ]) assert.match(sql,new RegExp(required,'i'),`missing ${required}`);
  assert.match(sql,/before update on public\.brain_operations/i);
  assert.match(sql,/before update on public\.brain_obligations/i);
  assert.match(sql,/revoke update on table public\.brain_operations from service_role/i);
  assert.match(sql,/revoke update on table public\.brain_obligations from service_role/i);
});
