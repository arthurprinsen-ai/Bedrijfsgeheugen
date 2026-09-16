import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const exact = [
  'supabase/migrations/20260915163110_brain_transition_obligation_cas_v3_column_qualification.sql',
  'supabase/migrations/20260915163520_brain_transition_obligation_cas_v4_rowcount.sql',
  'supabase/migrations/20260915163840_brain_transition_obligation_cas_v5_no_returning.sql',
  'supabase/migrations/20260915164121_brain_transition_obligation_cas_v6_direct_parameters.sql',
];

const staleAliases = [
  'supabase/migrations/20260915163500_brain_transition_obligation_cas_v4_rowcount.sql',
  'supabase/migrations/20260915164000_brain_transition_obligation_cas_v5_no_returning.sql',
  'supabase/migrations/20260915164500_brain_transition_obligation_cas_v6_direct_parameters.sql',
];

test('source mirrors exact production migration identities and forbids timestamp aliases', () => {
  for (const file of exact) assert.equal(fs.existsSync(file), true, `missing exact production identity: ${file}`);
  for (const file of staleAliases) assert.equal(fs.existsSync(file), false, `stale semantic timestamp alias must not exist: ${file}`);
});

test('final v6 source mirror preserves the live CAS safety contract', () => {
  const sql = fs.readFileSync(exact.at(-1), 'utf8');
  assert.match(sql, /update public\.brain_obligations as bo/i);
  assert.match(sql, /where bo\.id=p_obligation_id\s+and bo\.version=p_expected_version/i);
  assert.match(sql, /get diagnostics v_affected = row_count/i);
  assert.match(sql, /select bo\.\*\s+into v_row/i);
  assert.doesNotMatch(sql, /returning bo\.\* into v_row/i);
  assert.match(sql, /raise exception 'OBLIGATION_NOT_FOUND'/i);
  assert.match(sql, /raise exception 'STATE_VERSION_CONFLICT'/i);
  assert.match(sql, /revoke execute on function public\.brain_transition_obligation\(uuid,bigint,text,text,jsonb\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.brain_transition_obligation\(uuid,bigint,text,text,jsonb\) to service_role/i);
});
