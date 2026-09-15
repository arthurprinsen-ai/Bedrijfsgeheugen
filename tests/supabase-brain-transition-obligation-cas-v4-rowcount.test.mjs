import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const migrationsDir = path.join(root, 'supabase', 'migrations');
const suffix = '_brain_transition_obligation_cas_v4_rowcount.sql';
const matches = fs.readdirSync(migrationsDir).filter((name) => name.endsWith(suffix));

test('obligation CAS v4 decides success from UPDATE row count instead of FOUND', () => {
  assert.equal(matches.length, 1, `expected exactly one canonical ${suffix} migration`);
  const sql = fs.readFileSync(path.join(migrationsDir, matches[0]), 'utf8');
  assert.match(sql, /get\s+diagnostics\s+v_affected\s*=\s*row_count/i);
  assert.match(sql, /if\s+v_affected\s*=\s*1\s+then[\s\S]*return\s+v_row/i);
  assert.doesNotMatch(sql, /if\s+found\s+then/i);
  assert.match(sql, /update\s+public\.brain_obligations\s+as\s+bo[\s\S]*bo\.id\s*=\s*v_obligation_id[\s\S]*bo\.version\s*=\s*v_expected_version/i);
});

test('obligation CAS v4 preserves security boundary', () => {
  assert.equal(matches.length, 1, `expected exactly one canonical ${suffix} migration`);
  const sql = fs.readFileSync(path.join(migrationsDir, matches[0]), 'utf8');
  assert.match(sql, /security\s+definer/i);
  assert.match(sql, /set\s+search_path\s*=\s*public,\s*pg_catalog/i);
  assert.match(sql, /revoke\s+execute[\s\S]*from\s+public,\s*anon,\s*authenticated/i);
  assert.match(sql, /grant\s+execute[\s\S]*to\s+service_role/i);
});
