import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = 'supabase/migrations/20260831_brain_blocker_registry.sql';

test('P0 blocker registry persists one active blocker per fingerprint/scope/environment', () => {
  assert.equal(fs.existsSync(migrationPath), true, `${migrationPath} must exist`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.match(sql, /create table(?: if not exists)? public\.brain_blockers/i);
  assert.match(sql, /fingerprint text not null/i);
  assert.match(sql, /scope text not null/i);
  assert.match(sql, /environment text not null/i);
  assert.match(sql, /occurrence_count bigint not null default 1/i);
  assert.match(sql, /first_seen_at timestamptz not null/i);
  assert.match(sql, /last_seen_at timestamptz not null/i);
  assert.match(sql, /resolved_at timestamptz/i);
  assert.match(sql, /where resolved_at is null/i);
  assert.match(sql, /brain_register_blocker_occurrence/i);
  assert.match(sql, /occurrence_count\s*=\s*brain_blockers\.occurrence_count\s*\+\s*1/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on table public\.brain_blockers from public, anon, authenticated, service_role/i);
  assert.match(sql, /grant select, insert, update on table public\.brain_blockers to service_role/i);
  assert.match(sql, /revoke all on function public\.brain_register_blocker_occurrence/i);
  assert.match(sql, /grant execute on function public\.brain_register_blocker_occurrence[^;]*to service_role/i);
});
