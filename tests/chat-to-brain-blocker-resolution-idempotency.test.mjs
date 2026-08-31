import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = 'supabase/migrations/20260831_brain_blocker_resolution_idempotency.sql';

test('blocker resolution transport replay is idempotent and fail-closed', () => {
  assert.equal(fs.existsSync(migrationPath), true, `${migrationPath} must exist`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.match(sql, /create table(?: if not exists)? public\.brain_blocker_resolutions/i);
  assert.match(sql, /resolution_id text not null/i);
  assert.match(sql, /constraint brain_blocker_resolutions_resolution_id_unique unique \(resolution_id\)/i);
  assert.match(sql, /drop function if exists public\.brain_resolve_blocker\(uuid,bigint,jsonb\)/i);
  assert.match(sql, /brain_resolve_blocker/i);
  assert.match(sql, /p_resolution_id text/i);
  assert.match(sql, /on conflict \(resolution_id\) do nothing/i);
  assert.match(sql, /BLOCKER_RESOLUTION_IDENTITY_CONFLICT/i);
  assert.match(sql, /STATE_VERSION_CONFLICT/i);
  assert.match(sql, /return v_blocker/i);
  assert.match(sql, /revoke all on table public\.brain_blocker_resolutions from public, anon, authenticated, service_role/i);
  assert.match(sql, /grant select, insert on table public\.brain_blocker_resolutions to service_role/i);
});
