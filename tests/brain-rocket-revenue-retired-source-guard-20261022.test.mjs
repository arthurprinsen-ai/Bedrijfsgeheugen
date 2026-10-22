import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const basename = '20261005113000_powerhouse_rocket_revenue_event_spine_v1.sql';
const retired = 'supabase/migrations/' + basename;
const archived = 'supabase/migration-history/repository-only/' + basename;
const oracles = [
  'tests/brain-rocket-revenue-event-spine-v1.test.mjs',
  'tests/supabase-powerhouse-rocket-revenue-event-spine-v1.test.mjs',
];

test('rocket revenue oracle uses preserved non-executable SQL history', () => {
  assert.equal(fs.existsSync(retired), false, 'Already applied SQL must not be reintroduced as executable migration');
  const sql = fs.readFileSync(archived, 'utf8');
  assert.ok(sql.trim().length > 0, 'Historical SQL must be preserved and nonempty');
  for (const oracle of oracles) {
    const source = fs.readFileSync(oracle, 'utf8');
    assert.ok(source.includes(archived), `${oracle}: source must read archive`);
    assert.ok(!source.includes(retired), `${oracle}: retired path must be absent`);
  }
});
