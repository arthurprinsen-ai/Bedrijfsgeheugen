import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = 'supabase/migrations/20260831_brain_blocker_occurrence_idempotency.sql';

test('blocker occurrence transport replay cannot inflate occurrence_count', () => {
  assert.equal(fs.existsSync(migrationPath), true, `${migrationPath} must exist`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.match(sql, /create table(?: if not exists)? public\.brain_blocker_occurrences/i);
  assert.match(sql, /occurrence_id text not null/i);
  assert.match(sql, /constraint brain_blocker_occurrences_occurrence_id_unique unique \(occurrence_id\)/i);
  assert.match(sql, /brain_register_blocker_occurrence/i);
  assert.match(sql, /p_occurrence_id text/i);
  assert.match(sql, /on conflict \(occurrence_id\) do nothing/i);
  assert.match(sql, /if not found then/i);
  assert.match(sql, /return v_blocker/i);
  assert.match(sql, /occurrence_count\s*=\s*brain_blockers\.occurrence_count\s*\+\s*1/i);
  assert.match(sql, /revoke all on table public\.brain_blocker_occurrences from public, anon, authenticated, service_role/i);
  assert.match(sql, /grant select, insert on table public\.brain_blocker_occurrences to service_role/i);
});
