import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = 'supabase/migrations/20260831_brain_obligation_registry.sql';

test('P0 obligation registry enforces one canonical logical obligation', () => {
  assert.equal(fs.existsSync(migrationPath), true, `${migrationPath} must exist`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.match(sql, /create table(?: if not exists)? public\.brain_obligations/i);
  assert.match(sql, /unique\s*\(\s*obligation_type\s*,\s*capability_id\s*,\s*business_entity\s*,\s*business_period\s*,\s*business_timezone\s*\)/i);
  assert.match(sql, /payload_sha256 text not null/i);
  assert.match(sql, /OBLIGATION_PAYLOAD_CONFLICT/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on table public\.brain_obligations from public, anon, authenticated, service_role/i);
  assert.match(sql, /grant select, insert, update on table public\.brain_obligations to service_role/i);
  assert.match(sql, /revoke all on function public\.brain_create_obligation/i);
  assert.match(sql, /grant execute on function public\.brain_create_obligation[^;]*to service_role/i);
});
