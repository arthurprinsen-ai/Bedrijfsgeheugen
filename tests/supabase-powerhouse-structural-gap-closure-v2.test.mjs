import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918090000_powerhouse_structural_gap_closure_v2.sql','utf8');

test('tenant identity review is derived live, not copied to a parallel queue',()=>{
  assert.match(sql,/create or replace view public\.powerhouse_tenant_identity_review_v1/i);
  assert.match(sql,/from public\.scan_inzendingen/i);
  assert.match(sql,/from public\.offerte_inzendingen/i);
  assert.doesNotMatch(sql,/create table\s+public\.powerhouse_tenant_identity_review/i);
});

test('sales actions deterministically materialize canonical contiguous cycle stages',()=>{
  assert.match(sql,/powerhouse_materialize_sales_action_cycle_row_v1/);
  assert.match(sql,/cycle_id,subject_key,source_signal_ref/);
  assert.match(sql,/a\.action_id/);
  assert.match(sql,/a\.action_id,1,'signal'/);
  assert.match(sql,/a\.action_id,2,'analysis'/);
  assert.match(sql,/a\.action_id,3,'prediction'/);
  assert.match(sql,/a\.action_id,4,'decision'/);
  assert.match(sql,/a\.action_id,5,'execution'/);
  assert.match(sql,/truth_class','derived'/);
  assert.match(sql,/truth_class','observed'/);
  assert.match(sql,/if not exists \([\s\S]*?idempotency_key='sales-action:'/);
  assert.doesNotMatch(sql,/,'next_decision','powerhouse_sales_actions'/);
  assert.match(sql,/set status='blocked'/);
});

test('learning gap closure does not synthesize feedback, economics or realized value',()=>{
  assert.doesNotMatch(sql,/insert into public\.powerhouse_human_feedback_events/i);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_action_economics/i);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_realized_values/i);
  assert.match(sql,/executed_actions_missing_observed_economics/);
  assert.match(sql,/executed_actions_without_explicit_human_feedback/);
});

test('platform providers and customer connectors remain separate concepts',()=>{
  assert.match(sql,/'customer_connectors'/);
  assert.match(sql,/'platform_sources'/);
  assert.match(sql,/from public\.connector_definitions/);
  assert.match(sql,/from public\.powerhouse_evidence_sources/);
});

test('cycle recovery regression protects the production failure contract',()=>{
  assert.doesNotMatch(sql,/a\.action_id,\s*1,\s*'decision'/);
  assert.doesNotMatch(sql,/a\.action_id,\s*2,\s*'execution'/);
  assert.match(sql,/existing_sales_action_is_source_signal/);
});
