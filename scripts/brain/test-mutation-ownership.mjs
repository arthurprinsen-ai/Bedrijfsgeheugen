import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration='supabase/migrations/20260831_brain_mutation_ownership.sql';

test('mutation ownership enforces one active mutator per scope with governed transfer',()=>{
  assert.equal(fs.existsSync(migration),true,'mutation ownership migration must exist');
  const sql=fs.readFileSync(migration,'utf8');
  for(const required of [
    'brain_mutation_ownership','brain_claim_mutation_owner','brain_transfer_mutation_owner',
    'brain_retire_mutation_owner','OWNER_GENERATION_CONFLICT','MUTATION_OWNER_CONFLICT',
    'for update','security definer','unique'
  ]) assert.match(sql,new RegExp(required,'i'),`missing ${required}`);
  assert.match(sql,/where\s+mode='ACTIVE'/i,'must enforce a partial unique active-owner invariant');
  assert.match(sql,/revoke all on table public\.brain_mutation_ownership/i);
  assert.match(sql,/grant select on table public\.brain_mutation_ownership to service_role/i);
});
