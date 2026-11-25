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
test('successful production economics index retry preserves provider version and protected SQL', () => {
  const provider = readFileSync(new URL('../supabase/migrations/20261020132933_p0_4215_economics_candidate_index_guarded_retry.sql', import.meta.url));
  const protectedSql = readFileSync(new URL('../supabase/migrations/20261020112221_p0_4215_economics_candidate_index_before_portal_indexes.sql', import.meta.url));
  assert.deepEqual(provider, protectedSql);
  assert.equal(createHash('sha256').update(provider).digest('hex'), '6fc393681c29bd28bf3af41b88f31d8b6e5a180622b4820a7f6e90b534a3751b');
});
test('concurrent portal index provider identity preserves its protected source', () => {
  const provider = readFileSync(new URL('../supabase/migrations/20261020133013_p0_4215_portal_read_sort_indexes.sql', import.meta.url));
  const protectedSql = readFileSync(new URL('../supabase/migrations/20261020113000_p0_4215_portal_read_sort_indexes.sql', import.meta.url));
  assert.deepEqual(provider, protectedSql);
});
