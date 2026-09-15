import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const migrationsDir = path.join(root, 'supabase', 'migrations');
const suffix = '_brain_transition_obligation_cas_v6_direct_parameters.sql';
const matches = fs.readdirSync(migrationsDir).filter((name) => name.endsWith(suffix));

test('obligation CAS v6 binds SQL predicates directly to function parameters', () => {
  assert.equal(matches.length, 1, `expected exactly one canonical ${suffix} migration`);
  const sql = fs.readFileSync(path.join(migrationsDir, matches[0]), 'utf8');
  assert.match(sql, /where\s+bo\.id\s*=\s*p_obligation_id[\s\S]*and\s+bo\.version\s*=\s*p_expected_version/i);
  assert.match(sql, /state\s*=\s*p_state/i);
  assert.match(sql, /owner\s*=\s*coalesce\s*\(\s*p_owner\s*,\s*bo\.owner\s*\)/i);
  assert.match(sql, /evidence\s*=\s*coalesce\s*\(\s*p_evidence\s*,\s*bo\.evidence\s*\)/i);
  assert.doesNotMatch(sql, /v_obligation_id\s+uuid/i);
  assert.doesNotMatch(sql, /v_expected_version\s+bigint/i);
});

test('obligation CAS v6 reads the mutated row only after ROW_COUNT confirms one update', () => {
  assert.equal(matches.length, 1, `expected exactly one canonical ${suffix} migration`);
  const sql = fs.readFileSync(path.join(migrationsDir, matches[0]), 'utf8');
  assert.match(sql, /get\s+diagnostics\s+v_affected\s*=\s*row_count/i);
  assert.match(sql, /if\s+v_affected\s*=\s*1\s+then[\s\S]*select\s+bo\.\*[\s\S]*where\s+bo\.id\s*=\s*p_obligation_id[\s\S]*return\s+v_row/i);
  assert.match(sql, /security\s+definer/i);
  assert.match(sql, /revoke\s+execute[\s\S]*from\s+public,\s*anon,\s*authenticated/i);
  assert.match(sql, /grant\s+execute[\s\S]*to\s+service_role/i);
});
