import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const rawSql = await readFile(new URL('../supabase/migrations/20260830_portaal_stand_rls_initplan.sql', import.meta.url), 'utf8');
const sql = rawSql.replace(/--.*$/gm, '').toLowerCase();

for (const policy of ['eigen_stand_lezen','eigen_stand_maken','eigen_stand_wijzigen','eigen_stand_wissen']) {
  test(`${policy} is recreated for authenticated`, () => {
    assert.match(sql, new RegExp(`create policy ${policy} on public\\.portaal_stand[\\s\\S]*?to authenticated`));
  });
}

test('every executable auth uid check uses an initplan subquery', () => {
  const directCalls = sql.match(/auth\.uid\(\)/g) ?? [];
  const initplanCalls = sql.match(/\(select auth\.uid\(\)\)/g) ?? [];
  assert.equal(directCalls.length, 5);
  assert.equal(initplanCalls.length, 5);
});

test('own-row identity remains gebruiker_id equals auth uid', () => {
  const matches = sql.match(/gebruiker_id\s*=\s*\(select auth\.uid\(\)\)/g) ?? [];
  assert.equal(matches.length, 5);
});
