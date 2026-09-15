import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = 'supabase/migrations/20260915170000_powerhouse_tenant_identity_hardening_v1.sql';
const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

test('tenant RLS uses production membership authority directly', () => {
  assert.doesNotMatch(sql, /public\.mijn_organisaties\s*\(/, 'migration must not depend on non-existent mijn_organisaties() helper');
  assert.match(sql, /public\.leden/, 'membership authority must remain public.leden');
  assert.match(sql, /l\.gebruiker_id\s*=\s*auth\.uid\s*\(\s*\)/, 'RLS must bind authenticated user to membership');
  assert.match(sql, /l\.organisatie_id\s*=\s*scan_inzendingen\.organisatie_id|scan_inzendingen\.organisatie_id\s*=\s*l\.organisatie_id/, 'scan policy must bind row tenant to membership');
  assert.match(sql, /l\.organisatie_id\s*=\s*offerte_inzendingen\.organisatie_id|offerte_inzendingen\.organisatie_id\s*=\s*l\.organisatie_id/, 'offer policy must bind row tenant to membership');
  assert.match(sql, /l\.organisatie_id\s*=\s*portaal_stand\.organisatie_id|portaal_stand\.organisatie_id\s*=\s*l\.organisatie_id/, 'portal state policy must bind row tenant to membership');
});
