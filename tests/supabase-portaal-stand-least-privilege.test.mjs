import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const raw = (await readFile(new URL('../supabase/migrations/20260830_portaal_stand_least_privilege.sql', import.meta.url), 'utf8')).toLowerCase();
const sql = raw.replace(/--.*$/gm, '');

test('anonymous access is revoked completely', () => {
  assert.match(sql, /revoke all on table public\.portaal_stand from anon, authenticated/);
});

test('authenticated receives only CRUD required by existing own-row RLS policies', () => {
  assert.match(sql, /grant select, insert, update, delete on table public\.portaal_stand to authenticated/);
  assert.doesNotMatch(sql, /grant[^;]*(truncate|references|trigger)[^;]*to authenticated/);
});

test('service_role privileges are not changed by this migration', () => {
  assert.doesNotMatch(sql, /(grant|revoke)[^;]*service_role/);
});
