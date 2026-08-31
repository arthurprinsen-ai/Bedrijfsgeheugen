import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const migration='supabase/migrations/20260831_brain_supporting_control_plane.sql';
test('minimal command API is idempotent, leased and RPC-only',()=>{
  assert.equal(fs.existsSync(migration),true);
  const sql=fs.readFileSync(migration,'utf8');
  for(const x of ['brain_commands','brain_submit_command','brain_claim_commands','brain_ack_command','COMMAND_IDENTITY_CONFLICT','COMMAND_CLAIM_OWNERSHIP_CONFLICT','PENDING','CLAIMED','SUCCEEDED','FAILED','security definer']) assert.match(sql,new RegExp(x,'i'),`missing ${x}`);
  assert.match(sql,/revoke all on table public\.brain_commands/i);
  assert.match(sql,/grant select on table public\.brain_commands to service_role/i);
});
