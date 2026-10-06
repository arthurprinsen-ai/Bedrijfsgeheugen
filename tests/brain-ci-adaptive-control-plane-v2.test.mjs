import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { optimizeDailyTuning } from '../scripts/brain/autonomous-engineering-fabric-v3.mjs';

const read = path => readFile(path,'utf8');

test('background intelligence never consumes the ordinary PR fast lane', async () => {
  const policy=JSON.parse(await read('config/ci-control-plane-v2.json'));
  for (const workflow of policy.background_workflows_forbidden_on_pull_request) {
    const source=await read(workflow);
    assert.doesNotMatch(source,/\n  pull_request:/,workflow+' still has a direct PR trigger');
  }
});

test('Required remains canonical and merge-group capable while safe-transition is fail closed', async () => {
  const [required,tuning]=await Promise.all([
    read('.github/workflows/required-test.yml'),
    read('config/powerhouse-engineering-tuning.json').then(JSON.parse),
  ]);
  assert.match(required,/\n  pull_request:/);
  assert.match(required,/\n  merge_group:/);
  assert.match(required,/full_assurance:/);
  assert.match(required,/engineeringTuning\.ci\?\.pr_full_assurance/);
  assert.equal(tuning.ci.mode,'safe-transition');
  assert.equal(tuning.ci.pr_full_assurance,true);
  assert.equal(tuning.ci.merge_group_full_assurance,true);
  assert.equal(tuning.ci.max_pr_workflows_per_head,5);
});

test('optimizer cannot move full assurance off PR before real merge-group evidence exists', () => {
  const current={
    max_parallel_packages:4,
    candidate_batch_window_seconds:20,
    fast_path_target_seconds:45,
    speculative_execution_threshold:0.75,
    ci:{pr_full_assurance:true,merge_group_full_assurance:true,max_pr_workflows_per_head:5},
    safety:{required_release_gate:true,security_gate:true,production_readback:true,protected_merge:true,exact_sha_identity:true}
  };
  const withoutMergeGroup=optimizeDailyTuning({metrics:{sampled_jobs:100,failed_jobs:0,skipped_jobs:0,queue_wait_seconds_p95:10,execution_seconds_p95:60,workflow_fanout_per_sha_p95:4,merge_group_runs_7d:0},current});
  assert.equal(withoutMergeGroup.tuning.ci.pr_full_assurance,true);
  assert.equal(withoutMergeGroup.tuning.ci.mode,'safe-transition');

  const withMergeGroup=optimizeDailyTuning({metrics:{sampled_jobs:100,failed_jobs:0,skipped_jobs:0,queue_wait_seconds_p95:10,execution_seconds_p95:60,workflow_fanout_per_sha_p95:4,merge_group_runs_7d:3},current});
  assert.equal(withMergeGroup.tuning.ci.pr_full_assurance,false);
  assert.equal(withMergeGroup.tuning.ci.mode,'fast-pr-full-merge-group');
});

test('CI intelligence measures the SLOs that drive architecture selection', async () => {
  const source=await read('scripts/brain/powerhouse-ci-intelligence.mjs');
  for (const metric of ['required_queue_wait_seconds_p95','required_total_seconds_p95','workflow_fanout_per_sha_p95','merge_group_runs_7d','active_nonterminal_runs']) {
    assert.match(source,new RegExp(metric));
  }
});

test('external executors cannot keep a chat synchronously polling beyond 30 seconds', async () => {
  const [protocol,agents]=await Promise.all([
    read('config/powerhouse-fast-development-protocol-v2.json').then(JSON.parse),
    read('AGENTS.md'),
  ]);
  assert.deepEqual(protocol.waiting_external.state_machine,['RUNNING','WAITING_EXTERNAL','TERMINAL']);
  assert.equal(protocol.waiting_external.synchronous_wait_budget_seconds,30);
  assert.equal(protocol.waiting_external.long_polling_forbidden,true);
  assert.match(agents,/harde totale chat\/agent-budgetgrens van \*\*30 seconden\*\*/);
});
