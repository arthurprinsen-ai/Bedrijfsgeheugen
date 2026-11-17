import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const sql=readFileSync(new URL('../supabase/migrations/20261117123000_original_composer_bounded_fair_candidate_v2.sql',import.meta.url),'utf8');
test('canonical 879th original provider row equals the previously applied protected composer migration',()=>{
  assert.equal(lock.source,'supabase_migration_history');
  assert.equal(lock.applied.length,879);
  assert.deepEqual(lock.applied.at(-1),{version:'20261117123000',name:'original_composer_bounded_fair_candidate_v2'});
  assert.equal(lock.applied.filter(x=>x.version==='20261117123000').length,1);
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_commercial_message_candidates_v1/);
});
test('next original unmerged guardian migration remains unapplied; no false-green',()=>{
  assert.equal(lock.applied.some(x=>x.version==='20261117124500'),false);
  assert.match(lock.captured_at,/^2026-11-17T\d{2}:\d{2}:\d{2}/);
  assert.equal(lock.applied.at(-2).version,'20261117110000');
});
