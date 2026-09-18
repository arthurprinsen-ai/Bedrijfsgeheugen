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

test('decision cycles open only from canonical runtime signals',()=>{
  assert.match(sql,/powerhouse_open_cycle_from_runtime_signal_v1/);
  assert.match(sql,/event_type <> 'scan_submitted'/);
  assert.match(sql,/source <> 'website\.frisse_blik'/);
  assert.match(sql,/1,'signal','powerhouse_runtime_events'/);
  assert.match(sql,/runtime-signal:' \|\| e\.event_id::text/);
  assert.match(sql,/on conflict \(tenant_id,idempotency_key\) do nothing/i);
  assert.doesNotMatch(sql,/1,\s*'decision'/);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_cycle_events[\s\S]*?'analysis'/);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_cycle_events[\s\S]*?'prediction'/);
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
