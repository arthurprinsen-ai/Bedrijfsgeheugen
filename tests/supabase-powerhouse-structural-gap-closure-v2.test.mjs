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

test('sales actions deterministically materialize decision cycles',()=>{
  assert.match(sql,/powerhouse_materialize_sales_action_cycle_row_v1/);
  assert.match(sql,/cycle_id,subject_key,source_signal_ref/);
  assert.match(sql,/a\.action_id/);
  assert.match(sql,/sales-action:' \|\| a\.action_id::text \|\| ':decision'/);
  assert.match(sql,/on conflict \(tenant_id,idempotency_key\) do nothing/i);
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

test('strict canonical cycle remains evidence-first after historical action bootstrap',()=>{
  assert.match(sql,/cycles_waiting_for_stage_reconstruction/);
  assert.match(sql,/current_stage='signal'/);
  assert.match(sql,/Later canonical stages are never fabricated/);
  assert.match(sql,/if not exists \([\s\S]*?idempotency_key='sales-action:' \|\| a\.action_id::text \|\| ':signal'/);
  assert.doesNotMatch(sql,/a\.action_id,\s*2,\s*'execution'/);
  assert.doesNotMatch(sql,/a\.action_id,\s*4,\s*'decision'/);
});

test('tenant readiness distinguishes demo fixtures from unresolved production identity',()=>{
  assert.match(sql,/record_class/);
  assert.match(sql,/demo_or_test_records/);
  assert.match(sql,/production_or_unknown_unresolved_records/);
  assert.match(sql,/lower\(btrim\(coalesce\(s\.klant_slug,''\)\)\) in \('demo','test'\)/);
});

test('forecast readiness distinguishes future obligations from overdue calibration debt',()=>{
  assert.match(sql,/overdue_calibration_obligations/);
  assert.match(sql,/future_calibration_obligations/);
  assert.match(sql,/due_at <= now\(\)/);
  assert.match(sql,/due_at > now\(\)/);
});
