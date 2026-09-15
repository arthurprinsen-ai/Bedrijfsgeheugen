import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const migrationsDir = path.join(root, 'supabase', 'migrations');
const suffix = '_brain_transition_obligation_cas_v3_column_qualification.sql';
const matches = fs.readdirSync(migrationsDir).filter((name) => name.endsWith(suffix));

test('obligation CAS v3 explicitly qualifies target-row columns inside the composite-returning function', () => {
  assert.equal(matches.length, 1, `expected exactly one canonical ${suffix} migration`);
  const sql = fs.readFileSync(path.join(migrationsDir, matches[0]), 'utf8');
  assert.match(sql, /update\s+public\.brain_obligations\s+as\s+bo/i);
  assert.match(sql, /coalesce\s*\(\s*v_owner\s*,\s*bo\.owner\s*\)/i);
  assert.match(sql, /coalesce\s*\(\s*v_evidence\s*,\s*bo\.evidence\s*\)/i);
  assert.match(sql, /version\s*=\s*bo\.version\s*\+\s*1/i);
  assert.match(sql, /where\s+bo\.id\s*=\s*v_obligation_id[\s\S]*and\s+bo\.version\s*=\s*v_expected_version/i);
  assert.match(sql, /returning\s+bo\.\*\s+into\s+v_row/i);
});

test('obligation CAS v3 preserves fail-closed security and explicit stale-version semantics', () => {
  assert.equal(matches.length, 1, `expected exactly one canonical ${suffix} migration`);
  const sql = fs.readFileSync(path.join(migrationsDir, matches[0]), 'utf8');
  assert.match(sql, /security\s+definer/i);
  assert.match(sql, /set\s+search_path\s*=\s*public,\s*pg_catalog/i);
  assert.match(sql, /OBLIGATION_NOT_FOUND[\s\S]*STATE_VERSION_CONFLICT/i);
  assert.match(sql, /revoke\s+execute\s+on\s+function\s+public\.brain_transition_obligation\(uuid,bigint,text,text,jsonb\)\s+from\s+public,\s*anon,\s*authenticated/i);
  assert.match(sql, /grant\s+execute\s+on\s+function\s+public\.brain_transition_obligation\(uuid,bigint,text,text,jsonb\)\s+to\s+service_role/i);
});
