import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = 'supabase/migrations/20260831_brain_operation_registry_service_role_minimal.sql';

test('service_role keeps only the table privileges required by the operation registry', () => {
  assert.equal(fs.existsSync(migrationPath), true, `${migrationPath} must exist`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.match(sql, /revoke all on table public\.brain_operations from service_role/i);
  assert.match(sql, /grant select, insert, update on table public\.brain_operations to service_role/i);
  assert.doesNotMatch(sql, /grant[^;]*(delete|truncate|references|trigger)[^;]*to service_role/i);
});
