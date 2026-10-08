import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compileLearningEvaluationPlan,validateEvaluationContract} from '../scripts/brain/learning-canonicalization-gate.mjs';
const sql=readFileSync('docs/changes/2026-10-08-source-universe-operational-truth.sql','utf8');
test('catalog capability is not reported as source ingestion',()=>{
 assert.match(sql,/last_observed_at is not null/);
 assert.match(sql,/last_observed_at >= now\(\)-interval '24 hours'/);
 assert.match(sql,/live_without_observation/);
 assert.match(sql,/NO_RECENT_SOURCE_EVIDENCE/);
});
test('company impact and monetary claims remain evidence-gated',()=>{
 assert.match(sql,/status='READY' and impact_score is not null/);
 assert.match(sql,/monetary_without_evidence/);
 assert.match(sql,/GUARD_FAILURE/);
 assert.doesNotMatch(sql,/insert\s+into|update\s+public|delete\s+from|cron\.schedule/i);
});

const learningPath='brain/learning/2026-10-08-source-universe-operational-truth-v1.json';
test('Source Universe learning uses executable canonical Brain test paths',()=>{
  const record=JSON.parse(readFileSync(learningPath,'utf8'));
  const plan=compileLearningEvaluationPlan(record);
  const validated=validateEvaluationContract(record,plan);
  assert.deepEqual(validated.tests_by_mode.historical_replay,['tests/brain-source-universe-operational-truth-v1.test.mjs']);
  for(const mode of ['historical_replay','shadow','canary']){
    assert.deepEqual(record.evaluation[mode],['tests/brain-source-universe-operational-truth-v1.test.mjs']);
  }
});
test('historical object-only learning evaluation is rejected rather than rubber-stamped',()=>{
  const record=JSON.parse(readFileSync(learningPath,'utf8'));
  const invalid={...record,evaluation:{historical_replay:[{scenario:'catalog!=ingestion'}]}};
  assert.throws(()=>validateEvaluationContract(invalid,compileLearningEvaluationPlan(invalid)),/LEARNING_EVALUATION_TEST_PATH_INVALID/);
});
