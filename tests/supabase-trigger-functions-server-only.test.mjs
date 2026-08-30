import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = (await readFile(new URL('../supabase/migrations/20260830_trigger_functions_server_only.sql', import.meta.url), 'utf8')).toLowerCase();

for (const fn of ['brain_delivery_evidence_immutable', 'stand_bijgewerkt', 'zet_bijgewerkt_op']) {
  test(`${fn} is not executable by public client roles`, () => {
    assert.match(sql, new RegExp(`revoke execute on function public\\.${fn}\\(\\) from public, anon, authenticated`));
  });
}
