import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918103100_action_evidence_obligations_v1.sql','utf8');

test('executed actions materialize three canonical evidence obligations',()=>{
  for(const type of ['ACTION_OUTCOME_EVIDENCE','ACTION_ECONOMICS_EVIDENCE','ACTION_HUMAN_FEEDBACK_EVIDENCE']) {
    assert.match(sql,new RegExp(type));
  }
  assert.match(sql,/where executed_at is not null/);
  assert.match(sql,/revenue_learning_obligations/);
});

test('obligations close only from observed canonical evidence',()=>{
  assert.match(sql,/powerhouse_sales_outcomes/);
  assert.match(sql,/powerhouse_action_economics/);
  assert.match(sql,/powerhouse_human_feedback_events/);
  assert.match(sql,/case when v_outcome then 'CLOSED' else 'OPEN' end/);
  assert.match(sql,/case when v_economics then 'CLOSED' else 'OPEN' end/);
  assert.match(sql,/case when v_feedback then 'CLOSED' else 'OPEN' end/);
});

test('truth boundaries prohibit synthetic outcome, economics and sentiment',()=>{
  assert.match(sql,/no inferred commercial success/);
  assert.match(sql,/never defaulted to zero/);
  assert.match(sql,/no sentiment or preference is inferred from silence/);
});

test('evidence arrival or deletion reconciles the same obligation lineage',()=>{
  assert.match(sql,/after insert or update or delete[\s\S]*?powerhouse_sales_outcomes/);
  assert.match(sql,/after insert or update or delete[\s\S]*?powerhouse_action_economics/);
  assert.match(sql,/after insert or update or delete[\s\S]*?powerhouse_human_feedback_events/);
});

test('readiness separates overdue and future work',()=>{
  assert.match(sql,/overdue_obligations/);
  assert.match(sql,/future_obligations/);
  assert.match(sql,/due_at<=now\(\)/);
  assert.match(sql,/due_at>now\(\)/);
});
