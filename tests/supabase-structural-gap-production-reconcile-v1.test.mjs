import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918104600_structural_gap_production_reconcile_v1.sql','utf8');

test('reconcile refuses to delete any sales-action cycle with downstream evidence',()=>{
  assert.match(sql,/STRUCTURAL_RECONCILE_REFUSES_NON_SYNTHETIC_CYCLE_DELETE/);
  assert.match(sql,/e\.stage<>'signal'/);
  assert.match(sql,/e\.entity_type<>'powerhouse_sales_actions'/);
});

test('reconcile removes only superseded sales-action bootstrap cycles',()=>{
  assert.match(sql,/delete from public\.powerhouse_decision_cycles\s+where source_signal_ref like 'powerhouse_sales_actions:%'/i);
  assert.match(sql,/drop trigger if exists powerhouse_sales_actions_cycle_materializer_v1/);
  assert.match(sql,/drop function if exists public\.powerhouse_materialize_sales_action_cycle_row_v1\(uuid\)/);
});

test('reconcile installs runtime-signal authority and backfills only real scan signals',()=>{
  assert.match(sql,/powerhouse_open_cycle_from_runtime_signal_v1/);
  assert.match(sql,/event_type='scan_submitted'/);
  assert.match(sql,/source='website\.frisse_blik'/);
  assert.match(sql,/source_signal_ref like 'powerhouse_runtime_events:%'/);
});

test('reconcile does not fabricate later canonical stages',()=>{
  assert.doesNotMatch(sql,/insert into public\.powerhouse_cycle_events[\s\S]{0,800}'decision'/i);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_cycle_events[\s\S]{0,800}'execution'/i);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_cycle_events[\s\S]{0,800}'outcome'/i);
});
