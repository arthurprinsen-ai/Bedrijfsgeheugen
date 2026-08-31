import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260831_brain_production_truth.sql','utf8');

test('Production Truth has no service_role table-write bypass around reconciliation',()=>{
  assert.match(sql,/create or replace function public\.brain_reconcile_production_truth[\s\S]*security definer/i,'reconcile must be the privileged mutation boundary');
  assert.match(sql,/grant select on table public\.brain_production_truth to service_role/i,'service_role may read derived truth');
  assert.doesNotMatch(sql,/grant\s+(?:select,)?\s*insert(?:,update)?\s+on table public\.brain_production_truth to service_role/i,'service_role must not directly insert truth');
  assert.doesNotMatch(sql,/grant[\s\S]{0,80}update[\s\S]{0,80}brain_production_truth[\s\S]{0,40}service_role/i,'service_role must not directly update truth');
});
