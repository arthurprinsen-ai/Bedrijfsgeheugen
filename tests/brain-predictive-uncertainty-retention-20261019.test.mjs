import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261019200528_predictive_uncertain_attempt_retention_v1.sql',import.meta.url),'utf8');
test('both existing canonical writers use one uncertainty-state merge',()=>{
 assert.match(sql,/create or replace function public\.powerhouse_sync_forecast_calibration_obligation/);
 assert.match(sql,/create or replace function public\.powerhouse_refresh_forecast_calibration_obligations/);
 assert.equal((sql.match(/from public\.powerhouse_merge_calibration_obligation_v1\(/g)||[]).length,2);
});
test('pure merge is scoped and does not create queue, scheduler or fake outcomes',()=>{
 assert.match(sql,/returns table\(payload jsonb,due_at timestamptz,status text\)/);
 assert.match(sql,/immutable[\s\S]*security invoker/);
 assert.match(sql,/from public,anon,authenticated/);
 assert.doesNotMatch(sql,/cron\.schedule|create table|insert into public\.powerhouse_forecast_calibration/i);
});
test('provider behavioral fixture covers revisions, immutable closed evidence and backoff',()=>{
 const fixture=readFileSync(new URL('./supabase/predictive-uncertainty-retention-v1.sql',import.meta.url),'utf8');
 for(const name of ['same_revision_retains_uncertainty','changed_revision_clears_old_attempt','closed_evidence_is_immutable','new_obligation_uses_canonical_due','unbound_old_attempt_is_not_reused','earlier_backoff_never_advances_canonical_deadline'])assert.ok(fixture.includes(name));
 assert.doesNotMatch(fixture,/\b(update|insert|delete|create)\s/i);
});

test('both revisions cover every forecast field sent to the calibrator',()=>{
 for(const prefix of ['new','f']) for(const field of ['scope','scope_key','topic_key','predicted_event','predicted_problem','predicted_question','predicted_search_intent','probability','created_at','horizon_start','horizon_end','expected_by']){
  assert.ok(sql.includes(`${prefix}.${field}`),`${prefix}.${field}`);
 }
});
