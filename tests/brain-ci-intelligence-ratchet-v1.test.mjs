import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { optimizeDailyTuning } from '../scripts/brain/autonomous-engineering-fabric-v3.mjs';

const read = path => readFileSync(path,'utf8');

function unscopedPullRequestWorkflows(){
  const names=readdirSync('.github/workflows').filter(name=>/\.ya?ml$/.test(name)).sort();
  const rows=[];
  for(const name of names){
    const source=read('.github/workflows/'+name);
    const match=source.match(/\n  pull_request:\s*\n([\s\S]*?)(?=\n  [A-Za-z0-9_-]+:|\n[A-Za-z][A-Za-z0-9_-]*:|$)/);
    if(!match) continue;
    const block=match[1]||'';
    const closedOnly=/types:\s*\[\s*closed\s*\]/.test(block);
    const pathScoped=/\n\s{4}(?:paths|paths-ignore):/.test(block);
    if(!closedOnly&&!pathScoped) rows.push(name);
  }
  return rows;
}

test('CI intelligence measures Required latency and PR topology explicitly',()=>{
  const source=read('scripts/brain/powerhouse-ci-intelligence.mjs');
  for(const marker of [
    'required_queue_wait_seconds_p95',
    'required_total_seconds_p95',
    'unscoped_pull_request_workflow_count',
    'active_nonterminal_runs',
    'workflow_fanout_per_sha_p95'
  ]) assert.match(source,new RegExp(marker));
});

test('daily optimizer is not another pull-request workflow',()=>{
  const workflow=read('.github/workflows/powerhouse-autonomous-engineering-optimizer.yml');
  assert.doesNotMatch(workflow,/^\s{2}pull_request:/m);
  assert.match(workflow,/schedule:/);
  assert.match(workflow,/workflow_dispatch:/);
});

test('current unscoped PR topology stays within a monotone budget',()=>{
  const tuning=JSON.parse(read('config/powerhouse-engineering-tuning.json'));
  const workflows=unscopedPullRequestWorkflows();
  assert.equal(tuning.ci.architecture_mode,'protected-pr-fastlane');
  assert.equal(tuning.ci.unscoped_pr_workflow_target,2);
  assert.ok(workflows.length<=tuning.ci.unscoped_pr_workflow_budget,
    `unscoped PR workflow regression: ${workflows.length} > ${tuning.ci.unscoped_pr_workflow_budget}: ${workflows.join(', ')}`);
});

test('optimizer ratchets fanout budget down but never auto-expands it',()=>{
  const current={
    max_parallel_packages:4,
    candidate_batch_window_seconds:20,
    fast_path_target_seconds:45,
    speculative_execution_threshold:0.75,
    ci:{
      architecture_mode:'protected-pr-fastlane',
      required_queue_p95_target_seconds:30,
      required_total_p95_target_seconds:120,
      workflow_fanout_p95_budget:5,
      unscoped_pr_workflow_budget:5,
      unscoped_pr_workflow_target:2,
      stale_cancel_target_seconds:15,
      agent_external_wait_budget_seconds:30
    },
    safety:{required_release_gate:true,security_gate:true,production_readback:true,protected_merge:true,exact_sha_identity:true}
  };
  const reduced=optimizeDailyTuning({metrics:{
    sampled_jobs:50,failed_jobs:0,skipped_jobs:0,cancelled_jobs:0,
    queue_wait_seconds_p95:10,execution_seconds_p95:60,workflow_fanout_per_sha_p95:4,
    required_queue_wait_seconds_p95:12,required_total_seconds_p95:90,
    unscoped_pull_request_workflow_count:3
  },current});
  assert.equal(reduced.tuning.ci.unscoped_pr_workflow_budget,3);
  assert.ok(reduced.decisions.includes('ratchet-unscoped-pr-workflow-budget-down'));

  const regression=optimizeDailyTuning({metrics:{
    sampled_jobs:50,failed_jobs:0,skipped_jobs:0,cancelled_jobs:0,
    queue_wait_seconds_p95:10,execution_seconds_p95:60,workflow_fanout_per_sha_p95:4,
    required_queue_wait_seconds_p95:12,required_total_seconds_p95:90,
    unscoped_pull_request_workflow_count:4
  },current:{...current,ci:{...current.ci,unscoped_pr_workflow_budget:3}}});
  assert.equal(regression.tuning.ci.unscoped_pr_workflow_budget,3);
  assert.equal(regression.signals.unscoped_pr_workflow_budget_exceeded,true);
});
