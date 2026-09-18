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

test('legacy sales actions anchor strict cycles without fabricating missing stages',()=>{
  assert.match(sql,/powerhouse_materialize_sales_action_cycle_row_v1/);
  assert.match(sql,/cycle_id,subject_key,source_signal_ref/);
  assert.match(sql,/a\.action_id/);
  assert.match(sql,/sales-action:' \|\| a\.action_id::text \|\| ':signal'/);
  assert.match(sql,/legacy_action_observed_as_cycle_anchor/);
  assert.match(sql,/stage_semantics','signal_anchor_only'/);
  assert.match(sql,/missing_stages',jsonb_build_array\('analysis','prediction','decision'\)/);
  assert.doesNotMatch(sql,/sales-action:' \|\| a\.action_id::text \|\| ':execution'/);
  assert.doesNotMatch(sql,/sales-action:' \|\| a\.action_id::text \|\| ':expired'/);
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
