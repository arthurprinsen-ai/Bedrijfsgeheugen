import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = (await readFile(new URL('../supabase/migrations/20260830_public_intake_least_privilege.sql', import.meta.url), 'utf8')).toLowerCase();

test('public client roles lose all broad intake table privileges first', () => {
  assert.match(sql, /revoke all on table public\.scan_inzendingen, public\.offerte_inzendingen\s+from anon, authenticated/);
});

test('public client roles regain insert only', () => {
  assert.match(sql, /grant insert on table public\.scan_inzendingen, public\.offerte_inzendingen\s+to anon, authenticated/);
  assert.doesNotMatch(sql, /grant\s+(select|update|delete|truncate|references|trigger)/);
});
