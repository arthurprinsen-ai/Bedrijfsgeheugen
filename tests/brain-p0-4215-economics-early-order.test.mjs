import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = name => readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url),'utf8');
const functionName='20261020112220_p0_4215_economics_function_before_blocked_indexes.sql';
const indexName='20261020112221_p0_4215_economics_candidate_index_before_portal_indexes.sql';

test('approved bounded function is committed before the unrelated failing portal index',()=>{
  const early=read(functionName);
  assert.equal(early,read('20261020143000_p0_4215_economics_function_first.sql'));
  assert.ok(functionName.slice(0,14)<'20261020113000');
  assert.match(early,/limit 50\s+loop/i);
  assert.doesNotMatch(early,/\bCREATE\s+INDEX\b/i);
  assert.match(early,/FROM PUBLIC, anon, authenticated/);
});
test('exact approved economics index has its own bounded transaction before portal DDL',()=>{
  const early=read(indexName);
  const original=read('20261020125000_p0_4215_bounded_internal_research_economics.sql');
  const statement=sql=>sql.match(/CREATE INDEX IF NOT EXISTS powerhouse_sales_actions_internal_research_economics_candidates_p04215_idx[\s\S]*?;/)?.[0];
  assert.ok(statement(early));
  assert.equal(statement(early),statement(original));
  assert.ok(functionName.slice(0,14)<indexName.slice(0,14));
  assert.ok(indexName.slice(0,14)<'20261020113000');
  assert.match(early,/BEGIN;[\s\S]*SET LOCAL lock_timeout = '2s';[\s\S]*SET LOCAL statement_timeout = '20s';[\s\S]*COMMIT;/);
  assert.doesNotMatch(early,/CREATE OR REPLACE FUNCTION|\b(?:DELETE|DROP|TRUNCATE|UNSCHEDULE)\b|cron\./i);
});
test('original protected identities remain available for canonical replay',()=>{
  for(const name of ['20261020113000_p0_4215_portal_read_sort_indexes.sql','20261020125000_p0_4215_bounded_internal_research_economics.sql','20261020143000_p0_4215_economics_function_first.sql'])assert.ok(read(name).length>0);
});
