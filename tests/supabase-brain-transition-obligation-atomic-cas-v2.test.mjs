import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const migrationsDir = path.join(root, 'supabase', 'migrations');
const suffix = '_brain_transition_obligation_atomic_cas_v2.sql';
const matches = fs.readdirSync(migrationsDir).filter((name) => name.endsWith(suffix));

test('obligation transition uses one atomic id+version CAS instead of composite pre-read', () => {
  assert.equal(matches.length, 1, `expected exactly one canonical ${suffix} migration`);
  const sql = fs.readFileSync(path.join(migrationsDir, matches[0]), 'utf8');
  assert.match(sql, /update\s+public\.brain_obligations[\s\S]*where\s+id\s*=\s*v_obligation_id[\s\S]*and\s+version\s*=\s*v_expected_version[\s\S]*returning\s+\*/i);
  assert.doesNotMatch(sql, /select\s+\*\s+into\s+v_current[\s\S]*from\s+public\.brain_obligations/i);
  assert.match(sql, /if\s+not\s+found\s+then[\s\S]*STATE_VERSION_CONFLICT/i);
});

test('obligation transition remains security-definer and service-role-only', () => {
  assert.equal(matches.length, 1, `expected exactly one canonical ${suffix} migration`);
  const sql = fs.readFileSync(path.join(migrationsDir, matches[0]), 'utf8');
  assert.match(sql, /security\s+definer/i);
  assert.match(sql, /revoke\s+all\s+on\s+function\s+public\.brain_transition_obligation\(uuid,bigint,text,text,jsonb\)\s+from\s+public,anon,authenticated,service_role/i);
  assert.match(sql, /grant\s+execute\s+on\s+function\s+public\.brain_transition_obligation\(uuid,bigint,text,text,jsonb\)\s+to\s+service_role/i);
});
