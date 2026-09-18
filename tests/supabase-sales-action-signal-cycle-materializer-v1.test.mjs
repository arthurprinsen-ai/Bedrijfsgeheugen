import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918104500_sales_action_signal_cycle_materializer_v1.sql','utf8');

test('sales actions materialize one deterministic signal-stage cycle',()=>{
  assert.match(sql,/cycle_id,subject_key,source_signal_ref,current_stage,status/);
  assert.match(sql,/'canonical',a\.action_id,v_subject,v_evidence_ref,'signal','open'/);
  assert.match(sql,/powerhouse_sales_actions:/);
  assert.match(sql,/sales-action-signal:/);
});

test('materializer never fabricates later learning stages',()=>{
  assert.doesNotMatch(sql,/'decision'/);
  assert.doesNotMatch(sql,/'execution'/);
  assert.doesNotMatch(sql,/'outcome'/);
  assert.doesNotMatch(sql,/'economics'/);
  assert.doesNotMatch(sql,/'feedback'/);
  assert.match(sql,/truth','observed_sales_action'/);
});

test('all current and future sales actions are covered idempotently',()=>{
  assert.match(sql,/after insert on public\.powerhouse_sales_actions/i);
  assert.match(sql,/select public\.powerhouse_open_cycle_from_sales_action_v1\(action_id\)[\s\S]*from public\.powerhouse_sales_actions/i);
  assert.match(sql,/on conflict \(tenant_id,idempotency_key\) do nothing/i);
});

test('browser roles cannot invoke the privileged materializer',()=>{
  assert.match(sql,/revoke execute on function public\.powerhouse_open_cycle_from_sales_action_v1\(uuid\) from public, anon, authenticated/i);
  assert.match(sql,/grant execute on function public\.powerhouse_open_cycle_from_sales_action_v1\(uuid\) to service_role/i);
});
