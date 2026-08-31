import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath = 'supabase/migrations/20260831_brain_operation_registry_least_privilege.sql';

test('operation registry is server-only and RLS protected', () => {
  assert.equal(fs.existsSync(migrationPath), true, `${migrationPath} must exist`);
  const sql = fs.readFileSync(migrationPath, 'utf8');

  assert.match(sql, /alter table public\.brain_operations enable row level security/i);
  assert.match(sql, /revoke all on table public\.brain_operations from public, anon, authenticated/i);
  assert.match(sql, /grant select, insert, update on table public\.brain_operations to service_role/i);
  assert.match(sql, /revoke all on function public\.brain_create_operation\(text,text,text,text,text,text\) from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.brain_create_operation\(text,text,text,text,text,text\) to service_role/i);
});
