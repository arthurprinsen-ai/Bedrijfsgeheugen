import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918131000_action_learning_production_truth_v1.sql','utf8');

test('E2E and test fixtures are explicitly non-production',()=>{
  assert.match(sql,/e2e-test%/);
  assert.match(sql,/test-fixture%/);
  assert.match(sql,/non_production_test/);
  assert.match(sql,/excluded_test_fixture/);
});

test('human feedback remains visible but is not autonomous system debt',()=>{
  assert.match(sql,/human_optional_evidence/);
  assert.match(sql,/awaiting_human_feedback/);
  assert.match(sql,/no sentiment or preference is inferred from silence/);
});

test('system debt remains fail-closed for economics and outcomes',()=>{
  assert.match(sql,/system_evidence/);
  assert.match(sql,/overdue_system_obligations/);
  assert.match(sql,/ACTION_OUTCOME_EVIDENCE/);
  assert.match(sql,/ACTION_ECONOMICS_EVIDENCE/);
});

test('no synthetic evidence rows are inserted',()=>{
  assert.doesNotMatch(sql,/insert into public\.powerhouse_sales_outcomes/i);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_action_economics/i);
  assert.doesNotMatch(sql,/insert into public\.powerhouse_human_feedback_events/i);
});
