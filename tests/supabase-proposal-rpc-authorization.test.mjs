import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = (await readFile(new URL('../supabase/migrations/20260830_restrict_proposal_mutation_rpcs.sql', import.meta.url), 'utf8')).toLowerCase();

for (const signature of ['public.voorstel_afwijzen(uuid)', 'public.voorstel_overnemen(uuid, text)']) {
  test(`${signature} is not executable by public client roles`, () => {
    assert.match(sql, new RegExp(`revoke all on function ${signature.replace(/[()]/g, '\\$&')} from public, anon, authenticated`));
  });

  test(`${signature} remains executable by service_role`, () => {
    assert.match(sql, new RegExp(`grant execute on function ${signature.replace(/[()]/g, '\\$&')} to service_role`));
  });
}
