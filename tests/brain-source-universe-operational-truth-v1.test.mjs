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


const recovery=readFileSync('supabase/migrations/20261020080000_restore_external_intelligence_existing_mux_v3.sql','utf8');
test('historical replay: existing hourly mux recovers missing canonical Source Universe stage',()=>{
 assert.match(recovery,/create or replace function public\.powerhouse_runtime_scheduler_mux_v3/i);
 assert.match(recovery,/powerhouse_runtime_scheduler_mux_v2\(p_now\)/);
 assert.match(recovery,/v_utc_minute\s*=\s*54/);
 assert.match(recovery,/powerhouse_runtime_mux_task_v1\(/);
 assert.match(recovery,/external-intelligence-universe/);
 assert.match(recovery,/powerhouse_refresh_external_intelligence_universe_v1\(''canonical'',200\)/);
 assert.doesNotMatch(recovery,/\b(select|perform)\s+cron\.schedule\s*\(/i);
 assert.doesNotMatch(recovery,/\bcreate\s+(table|sequence|schema)\b/i);
});
test('failed Source Universe refresh is reported as unhealthy and never silently green',()=>{
 assert.match(recovery,/coalesce\(\(v_universe_task->>'ok'\)::boolean,false\)/);
 assert.match(recovery,/v_existing_healthy\s+and\s+coalesce/);
 assert.match(recovery,/jsonb_array\(v_universe_task\)/);
 assert.match(recovery,/\{tasks\}/);
});
test('existing Infinity and source mux remain authoritative; bounded, no parallel worker',()=>{
 assert.match(recovery,/powerhouse_infinity_operating_loop_v1\(null,v_local::date\)/);
 assert.match(recovery,/10000\s*\)/);
 assert.match(recovery,/set search_path to 'public', 'pg_catalog'/);
 assert.doesNotMatch(recovery,/pg_net|net\.http_post|create\s+trigger/i);
});
