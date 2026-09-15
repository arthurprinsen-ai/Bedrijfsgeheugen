import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const migrationsDir = path.join(root, 'supabase', 'migrations');
const suffix = '_brain_transition_obligation_cas_v5_no_returning.sql';
const matches = fs.readdirSync(migrationsDir).filter((name) => name.endsWith(suffix));

test('obligation CAS v5 separates atomic update from row readback', () => {
  assert.equal(matches.length, 1, `expected exactly one canonical ${suffix} migration`);
  const sql = fs.readFileSync(path.join(migrationsDir, matches[0]), 'utf8');
  assert.match(sql, /update\s+public\.brain_obligations\s+as\s+bo[\s\S]*where\s+bo\.id\s*=\s*v_obligation_id[\s\S]*and\s+bo\.version\s*=\s*v_expected_version/i);
  assert.doesNotMatch(sql, /update[\s\S]*returning\s+bo\.\*/i);
  assert.match(sql, /get\s+diagnostics\s+v_affected\s*=\s*row_count/i);
  assert.match(sql, /if\s+v_affected\s*=\s*1\s+then[\s\S]*select\s+bo\.\*[\s\S]*into\s+v_row[\s\S]*where\s+bo\.id\s*=\s*v_obligation_id[\s\S]*return\s+v_row/i);
});

test('obligation CAS v5 keeps fail-closed errors and service-role-only execution', () => {
  assert.equal(matches.length, 1, `expected exactly one canonical ${suffix} migration`);
  const sql = fs.readFileSync(path.join(migrationsDir, matches[0]), 'utf8');
  assert.match(sql, /OBLIGATION_NOT_FOUND[\s\S]*STATE_VERSION_CONFLICT/i);
  assert.match(sql, /security\s+definer/i);
  assert.match(sql, /set\s+search_path\s*=\s*public,\s*pg_catalog/i);
  assert.match(sql, /revoke\s+execute[\s\S]*from\s+public,\s*anon,\s*authenticated/i);
  assert.match(sql, /grant\s+execute[\s\S]*to\s+service_role/i);
});
