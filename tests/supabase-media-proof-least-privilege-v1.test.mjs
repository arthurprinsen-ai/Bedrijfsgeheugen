import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918094500_media_proof_least_privilege_v1.sql','utf8');

test('media proof evidence is explicitly server-authoritative',()=>{
  assert.match(sql,/revoke all on table public\.powerhouse_media_proof_evidence_v1 from anon, authenticated/i);
  assert.match(sql,/grant select,insert,update,delete,truncate,references,trigger on table public\.powerhouse_media_proof_evidence_v1 to service_role/i);
});

test('least-privilege fix does not create permissive RLS policies',()=>{
  assert.doesNotMatch(sql,/create policy/i);
  assert.doesNotMatch(sql,/using\s*\(true\)/i);
});
