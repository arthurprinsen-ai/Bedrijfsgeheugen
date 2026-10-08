import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildDailyEngineeringTuningCandidate } from '../tools/delivery/daily-engineering-tuning-candidate.mjs';

const sha='a'.repeat(40);
const safety={required_release_gate:true,security_gate:true,production_readback:true,
  protected_merge:true,exact_sha_identity:true,autonomous_gate_weakening_forbidden:true};
const ci={direct_pr_workflow_budget:8,direct_pr_workflow_target:2,required_queue_p95_slo_seconds:30,
  required_total_p95_slo_seconds:120,max_pr_workflows_per_head:5};
const previous={max_parallel_packages:4,candidate_batch_window_seconds:20,ci,safety};
const proposed={...previous,max_parallel_packages:3,ci:{...ci,direct_pr_workflow_budget:7}};
const args={runId:'37700012345',baseSha:sha,previous,proposed,date:'2026-10-08',
  observation:{observed_at:'2026-10-08T12:00:00Z',signals:{queue_wait_seconds_p95:145},decisions:['reduce-runner-pressure-and-batch-more']}};

test('candidate includes machine-readable Brain learning, ledger, change note and exact scoped PR contract',()=>{
  const x=buildDailyEngineeringTuningCandidate(args);
  assert.equal(x.paths.length,4);
  assert.equal(new Set(x.paths).size,4);
  assert.match(x.body,/^Base-SHA: a{40}$/m);
  assert.match(x.body,/^Scope-Budget: 4$/m);
  assert.match(x.body,/^Change-Scope: /m);
  assert.equal(x.body.split('\n').find(x=>x.startsWith('Change-Scope: ')).slice(14),x.paths.join(', '));
  const learning=JSON.parse(x.artifacts[x.paths[1]]);
  assert.equal(learning.status,'CANDIDATE_NOT_PRODUCTION_VERIFIED');
  assert.equal(learning.compiler.failure_class,'CI');
  assert.deepEqual(learning.evaluation.historical_replay,['tests/brain-engineering-tuning-candidate.test.mjs']);
  assert.equal(learning.evidence.required_status,'PENDING_PROTECTED_CHECKS');
  assert.equal(learning.evidence.realized_business_value,'NOT_MEASURED');
  assert.ok(x.artifacts[x.paths[2]].includes('not a verified speed'));
  assert.ok(x.artifacts[x.paths[3]].includes('Canonical candidate:'));
});

test('candidate is deterministic for identical measured input and run id',()=>{
  assert.deepEqual(buildDailyEngineeringTuningCandidate(args),buildDailyEngineeringTuningCandidate(args));
  const another=buildDailyEngineeringTuningCandidate({...args,runId:'37700012346'});
  assert.notEqual(another.obligationId,buildDailyEngineeringTuningCandidate(args).obligationId);
});

test('cannot bypass safety, expand workflow budget or degrade Required/CodeQL contract',()=>{
  assert.throws(()=>buildDailyEngineeringTuningCandidate({...args,proposed:{...proposed,safety:{...safety,protected_merge:false}}}),/SAFETY_WEAKENING_FORBIDDEN/);
  assert.throws(()=>buildDailyEngineeringTuningCandidate({...args,proposed:{...proposed,ci:{...ci,direct_pr_workflow_budget:9}}}),/DIRECT_PR_BUDGET_REGRESSION/);
  assert.throws(()=>buildDailyEngineeringTuningCandidate({...args,proposed:{...proposed,ci:{...ci,required_total_p95_slo_seconds:200}}}),/CANONICAL_CI_GATES_DRIFT/);
  assert.throws(()=>buildDailyEngineeringTuningCandidate({...args,previous:proposed}),/NO_TUNING_DIFF/);
  assert.throws(()=>buildDailyEngineeringTuningCandidate({...args,baseSha:'abc'}),/BASE_SHA_INVALID/);
});

test('daily scheduled workflow must preserve retirement proof, closure artifacts and fail on auto-merge errors',async()=>{
  const workflow=await readFile('.github/workflows/powerhouse-autonomous-engineering-optimizer.yml','utf8');
  assert.match(workflow,/brain-engineering-tuning-candidate\.test\.mjs/);
  assert.match(workflow,/daily-engineering-tuning-candidate\.mjs --write/);
  assert.match(workflow,/docs\/development-ledger-events/);
  assert.match(workflow,/gh pr comment/);
  assert.match(workflow,/gh pr close/);
  assert.match(workflow,/MAIN_EPOCH_DRIFT/);
  assert.doesNotMatch(workflow,/gh pr merge[^\n]*\|\| true/);
  assert.doesNotMatch(workflow,/^  pull_request:/m);
});
