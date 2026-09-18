import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918111500_execution_evidence_obligations_v1.sql','utf8');

test('real executed actions get idempotent economics and feedback obligations',()=>{
  assert.match(sql,/action-economics-required:/);
  assert.match(sql,/human-feedback-required:/);
  assert.match(sql,/on conflict\(dedupe_key\) do update/i);
  assert.match(sql,/after insert or update of executed_at,status on public\.powerhouse_sales_actions/i);
});

test('missing economics and feedback are never inferred',()=>{
  assert.match(sql,/unknown costs and effort remain missing; zero is never inferred from absence/);
  assert.match(sql,/absence of feedback is not approval, rejection or no-response/);
  assert.match(sql,/MISSING_EVIDENCE/);
});

test('existing evidence closes its exact obligation event-driven',()=>{
  assert.match(sql,/after insert or update on public\.powerhouse_action_economics/i);
  assert.match(sql,/after insert on public\.powerhouse_human_feedback_events/i);
  assert.match(sql,/case when v_economics\.economics_id is null then 'decided' else 'closed' end/);
  assert.match(sql,/case when v_feedback\.feedback_id is null then 'decided' else 'closed' end/);
});

test('explicit test actions are retained but ignored for production learning debt',()=>{
  assert.match(sql,/ignored_reason','explicit_test_action'/);
  assert.match(sql,/state='ignored'/);
  assert.match(sql,/subject_key,''\)\) ~ '\(\^\|\/\)test\[-\/:0-9\]'/);
  assert.match(sql,/powerhouse_execution_evidence_gap_v1/);
});

test('privileged obligation functions stay service-role only',()=>{
  assert.match(sql,/revoke execute on function public\.powerhouse_materialize_execution_evidence_obligations_v1\(uuid\) from public,anon,authenticated/i);
  assert.match(sql,/grant execute on function public\.powerhouse_materialize_execution_evidence_obligations_v1\(uuid\) to service_role/i);
});
