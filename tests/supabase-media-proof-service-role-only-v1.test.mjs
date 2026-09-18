import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918095500_media_proof_service_role_only_v1.sql','utf8');

test('media proof table is explicitly closed to browser roles',()=>{
  assert.match(sql,/revoke all on table public\.powerhouse_media_proof_evidence_v1 from anon, authenticated/i);
  assert.match(sql,/grant all on table public\.powerhouse_media_proof_evidence_v1 to service_role/i);
});

test('hardening does not disable RLS or add permissive policies',()=>{
  assert.doesNotMatch(sql,/disable row level security/i);
  assert.doesNotMatch(sql,/create policy/i);
});
