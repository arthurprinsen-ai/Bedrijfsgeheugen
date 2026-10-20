import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

const expected = '895c2c9e46d72c811bd6bed9639e73562fe8f4fabeba6eecc69e76bdc43f34df';
for (const version of ['20261020104501','20261020104518']) {
  test(`production migration ${version} remains replayable with exact provider SQL`, () => {
    const sql = readFileSync(new URL(`../supabase/migrations/${version}_p0_4215_canonical_cron_pressure_dephase.sql`, import.meta.url));
    assert.equal(createHash('sha256').update(sql).digest('hex'), expected);
  });
}
test('original protected migration identity is retained byte-for-byte', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261020124500_p0_4215_canonical_cron_pressure_dephase.sql', import.meta.url));
  assert.equal(createHash('sha256').update(sql).digest('hex'), expected);
});
test('newly observed contact function version and protected original preserve exact provider bytes', () => {
  for (const version of ['20261020112219','20261020140000']) {
    const sql = readFileSync(new URL(`../supabase/migrations/${version}_contact_authority_preselect_function_only_p0_4198.sql`, import.meta.url));
    assert.equal(createHash('sha256').update(sql).digest('hex'), '467ef79cfbea084fcdc5954d3a6d9b2c8682d9f9cdbc6e79abc3e2ff06ab1346');
  }
});
