import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyEngineeringRisk,
  routeEngineeringAgent,
  buildClosureManifest,
  optimizeDailyTuning,
  validateAutonomousEngineeringFabricV3
} from '../scripts/brain/autonomous-engineering-fabric-v3.mjs';

test('risk classifier keeps docs fast and security/database fail-closed',()=>{
  assert.equal(classifyEngineeringRisk(['docs/changes/a.md']),'R0');
  assert.equal(classifyEngineeringRisk(['portal-v2/modules/card.js']),'R1');
  assert.equal(classifyEngineeringRisk(['tests/example.test.mjs']),'R2');
  assert.equal(classifyEngineeringRisk(['scripts/brain/x.mjs']),'R3');
  assert.equal(classifyEngineeringRisk(['supabase/migrations/1.sql']),'R4');
});

test('agent routing prefers domain fit and can incorporate proven history',()=>{
  const route=routeEngineeringAgent({paths:['portal-v2/modules/card.js'],capabilities:['design','verify'],scorecard:{'agent-website-ux':{observations:10,first_pass_success:0.95,rework_rate:0.02,ci_failure_rate:0.02,production_incident_rate:0,normalized_lead_time:0.2}},policy:{routing:{minimum_observations_for_history_weight:5}}});
  assert.equal(route.primaryAgentId,'agent-website-ux');
});

test('closure is generated late and keeps shared hot files as projections',()=>{
  const closure=buildClosureManifest({obligationId:'Example Feature V1',changedPaths:['brain/example.mjs']});
  assert.equal(closure.lateBound,true);
  assert.ok(closure.outputs.some(p=>p.startsWith('brain/learning/')));
  assert.deepEqual(closure.projections,['skills','system-map','release-evidence']);
});

test('daily optimizer reduces pressure without weakening safety',()=>{
  const current={max_parallel_packages:4,candidate_batch_window_seconds:20,fast_path_target_seconds:45,speculative_execution_threshold:0.75,safety:{}};
  const result=optimizeDailyTuning({metrics:{queue_wait_seconds_p95:180,execution_seconds_p95:700,cancelled_jobs:12,failed_jobs:4,sampled_jobs:20},current});
  assert.equal(result.tuning.max_parallel_packages,3);
  assert.ok(result.tuning.candidate_batch_window_seconds>20);
  assert.ok(result.tuning.speculative_execution_threshold>0.75);
  for(const key of ['required_release_gate','security_gate','production_readback','protected_merge','exact_sha_identity']) assert.equal(result.tuning.safety[key],true);
});

test('daily optimizer may increase safe parallelism when queue and failures are low',()=>{
  const current={max_parallel_packages:4,candidate_batch_window_seconds:20,fast_path_target_seconds:45,speculative_execution_threshold:0.75,safety:{}};
  const result=optimizeDailyTuning({metrics:{queue_wait_seconds_p95:10,execution_seconds_p95:80,cancelled_jobs:0,failed_jobs:0,sampled_jobs:50},current});
  assert.equal(result.tuning.max_parallel_packages,5);
  assert.ok(result.tuning.speculative_execution_threshold<0.75);
});

test('canonical v3 policy validates',async()=>{
  const result=await validateAutonomousEngineeringFabricV3();
  assert.equal(result.ok,true);
  assert.deepEqual(result.errors,[]);
});


test('daily optimizer reacts to fanout and skip waste without persisting observations',()=>{
  const current={max_parallel_packages:4,candidate_batch_window_seconds:20,fast_path_target_seconds:45,speculative_execution_threshold:0.75,safety:{}};
  const result=optimizeDailyTuning({metrics:{
    queue_wait_seconds_p95:20,
    execution_seconds_p95:200,
    cancelled_jobs:0,
    failed_jobs:1,
    skipped_jobs:30,
    sampled_jobs:50,
    workflow_fanout_per_sha_p95:12
  },current});
  assert.equal(result.tuning.max_parallel_packages,3);
  assert.equal(result.tuning.candidate_batch_window_seconds,30);
  assert.ok(result.decisions.includes('reduce-fanout-and-batch-more'));
  assert.equal(result.signals.workflow_fanout_per_sha_p95,12);
  assert.equal(result.signals.skipped_rate,0.6);
  assert.equal(Object.hasOwn(result.tuning,'observation'),false);
});

test('daily optimizer reduces pressure when fanout or skipped work exceeds the v2 waste budget',()=>{
  const current={max_parallel_packages:4,candidate_batch_window_seconds:20,fast_path_target_seconds:45,speculative_execution_threshold:0.75,safety:{}};
  const result=optimizeDailyTuning({metrics:{
    queue_wait_seconds_p95:10,
    execution_seconds_p95:100,
    cancelled_jobs:0,
    failed_jobs:0,
    skipped_jobs:20,
    sampled_jobs:50,
    workflow_fanout_per_sha_p95:9
  },current});
  assert.equal(result.tuning.max_parallel_packages,3);
  assert.equal(result.tuning.candidate_batch_window_seconds,30);
  assert.equal(result.decisions.includes('increase-safe-parallelism'),false);
  assert.equal(result.decisions.includes('reduce-fanout-and-batch-more'),true);
  assert.equal(result.signals.skipped_rate,0.4);
  assert.equal(result.signals.workflow_fanout_per_sha_p95,9);
});


test('high-priority calibration can veto upward tuning but cannot mutate tuning directly',()=>{
  const current={max_parallel_packages:4,candidate_batch_window_seconds:20,fast_path_target_seconds:45,speculative_execution_threshold:0.75,safety:{}};
  const result=optimizeDailyTuning({
    metrics:{queue_wait_seconds_p95:10,execution_seconds_p95:80,cancelled_jobs:0,failed_jobs:0,skipped_jobs:0,sampled_jobs:50,workflow_fanout_per_sha_p95:3},
    calibration:{mode:'SHADOW_RECOMMENDATIONS',recommendations:[{id:'reduce-workflow-fanout',priority:'high'}]},
    current
  });
  assert.equal(result.tuning.max_parallel_packages,4);
  assert.equal(result.tuning.speculative_execution_threshold,0.75);
  assert.equal(result.decisions.includes('increase-safe-parallelism'),false);
  assert.equal(result.decisions.includes('allow-more-safe-speculation'),false);
  assert.deepEqual(result.signals.calibration_high_priority_recommendations,['reduce-workflow-fanout']);
  assert.equal(Object.hasOwn(result.tuning,'calibration'),false);
});

test('low-priority calibration does not block otherwise-safe upward tuning',()=>{
  const current={max_parallel_packages:4,candidate_batch_window_seconds:20,fast_path_target_seconds:45,speculative_execution_threshold:0.75,safety:{}};
  const result=optimizeDailyTuning({
    metrics:{queue_wait_seconds_p95:10,execution_seconds_p95:80,cancelled_jobs:0,failed_jobs:0,skipped_jobs:0,sampled_jobs:50,workflow_fanout_per_sha_p95:3},
    calibration:{mode:'SHADOW_RECOMMENDATIONS',recommendations:[{id:'tighten-impact-routing',priority:'medium'}]},
    current
  });
  assert.equal(result.tuning.max_parallel_packages,5);
  assert.ok(result.tuning.speculative_execution_threshold<0.75);
});


test('Required SLO breach reduces pressure even when global queue looks healthy',()=>{
  const current={max_parallel_packages:4,candidate_batch_window_seconds:20,fast_path_target_seconds:45,speculative_execution_threshold:0.75,ci:{direct_pr_workflow_budget:20},safety:{}};
  const result=optimizeDailyTuning({metrics:{
    queue_wait_seconds_p95:10,
    required_queue_wait_seconds_p95:45,
    required_total_seconds_p95:140,
    execution_seconds_p95:80,
    cancelled_jobs:0,
    failed_jobs:0,
    skipped_jobs:0,
    sampled_jobs:50,
    workflow_fanout_per_sha_p95:4,
    direct_pull_request_workflow_count:12
  },current});
  assert.equal(result.tuning.max_parallel_packages,3);
  assert.ok(result.decisions.includes('required-fast-gate-slo-breach'));
  assert.equal(result.signals.required_queue_wait_seconds_p95,45);
  assert.equal(result.signals.required_total_seconds_p95,140);
});

test('direct PR workflow budget only ratchets downward and never auto-expands',()=>{
  const current={max_parallel_packages:4,candidate_batch_window_seconds:20,fast_path_target_seconds:45,speculative_execution_threshold:0.75,ci:{direct_pr_workflow_budget:12},safety:{}};
  const reduced=optimizeDailyTuning({metrics:{queue_wait_seconds_p95:10,required_queue_wait_seconds_p95:10,required_total_seconds_p95:80,execution_seconds_p95:80,failed_jobs:0,skipped_jobs:0,sampled_jobs:50,workflow_fanout_per_sha_p95:4,direct_pull_request_workflow_count:9},current});
  assert.equal(reduced.tuning.ci.direct_pr_workflow_budget,9);
  assert.ok(reduced.decisions.includes('ratchet-direct-pr-workflow-budget-down'));
  const regression=optimizeDailyTuning({metrics:{queue_wait_seconds_p95:10,required_queue_wait_seconds_p95:10,required_total_seconds_p95:80,execution_seconds_p95:80,failed_jobs:0,skipped_jobs:0,sampled_jobs:50,workflow_fanout_per_sha_p95:4,direct_pull_request_workflow_count:11},current:{...current,ci:{direct_pr_workflow_budget:9}}});
  assert.equal(regression.tuning.ci.direct_pr_workflow_budget,9);
  assert.ok(regression.decisions.includes('direct-pr-workflow-budget-regression-observed'));
});

test('adaptive optimizer cannot weaken immutable safety and observation budgets',()=>{
  const current={max_parallel_packages:4,candidate_batch_window_seconds:20,fast_path_target_seconds:45,speculative_execution_threshold:0.75,ci:{direct_pr_workflow_budget:8},safety:{}};
  const result=optimizeDailyTuning({metrics:{queue_wait_seconds_p95:5,required_queue_wait_seconds_p95:5,required_total_seconds_p95:50,execution_seconds_p95:50,failed_jobs:0,skipped_jobs:0,sampled_jobs:50,workflow_fanout_per_sha_p95:3,direct_pull_request_workflow_count:8},current});
  assert.equal(result.tuning.ci.direct_pr_workflow_target,2);
  assert.equal(result.tuning.ci.max_pr_workflows_per_head,5);
  assert.equal(result.tuning.ci.required_queue_p95_slo_seconds,30);
  assert.equal(result.tuning.ci.required_total_p95_slo_seconds,120);
  assert.equal(result.tuning.ci.agent_external_wait_budget_seconds,30);
  assert.equal(result.tuning.ci.unchanged_state_no_repoll_seconds,120);
  assert.equal(result.tuning.safety.autonomous_gate_weakening_forbidden,true);
});

test('optimizer and self evolution do not allocate standalone PR workflows',async()=>{
  const {readFile}=await import('node:fs/promises');
  const [optimizer,selfEvolution,intelligence]=await Promise.all([
    readFile('.github/workflows/powerhouse-autonomous-engineering-optimizer.yml','utf8'),
    readFile('.github/workflows/powerhouse-daily-self-evolution.yml','utf8'),
    readFile('scripts/brain/powerhouse-ci-intelligence.mjs','utf8')
  ]);
  assert.doesNotMatch(optimizer,/^  pull_request:/m);
  assert.doesNotMatch(selfEvolution,/^  pull_request:/m);
  assert.doesNotMatch(optimizer,/fetch-depth:\s*0/);
  assert.doesNotMatch(optimizer,/cat <<EOF/);
  assert.doesNotMatch(optimizer,/^Obligation-ID:/m);
  assert.match(optimizer,/printf '%s\\n'/);
  for(const metric of ['required_queue_wait_seconds_p95','required_total_seconds_p95','direct_pull_request_workflow_count','duplicate_workflow_runs_7d','duplicate_open_obligations','retired_pr_churn_7d']) assert.match(intelligence,new RegExp(metric));
});

test('unobserved runner performance cannot trigger speculative or parallel auto-tuning',()=>{
  const current={max_parallel_packages:4,candidate_batch_window_seconds:20,fast_path_target_seconds:45,speculative_execution_threshold:0.75,ci:{direct_pr_workflow_budget:8},safety:{}};
  const result=optimizeDailyTuning({metrics:{
    queue_wait_seconds_p95:5,execution_seconds_p95:40,failed_jobs:0,skipped_jobs:0,sampled_jobs:0,
    workflow_fanout_per_sha_p95:1,direct_pull_request_workflow_count:8
  },current});
  assert.equal(result.tuning.max_parallel_packages,4);
  assert.equal(result.tuning.speculative_execution_threshold,0.75);
  assert.equal(result.signals.evidence_ready,false);
  assert.ok(result.decisions.includes('insufficient-runner-evidence-no-runtime-tuning'));
});

test('legitimate skipped lanes never masquerade as consumed runner time',()=>{
  const current={max_parallel_packages:4,candidate_batch_window_seconds:20,fast_path_target_seconds:45,speculative_execution_threshold:0.75,ci:{direct_pr_workflow_budget:8},safety:{}};
  const result=optimizeDailyTuning({metrics:{
    queue_wait_seconds_p95:10,required_queue_wait_seconds_p95:10,required_total_seconds_p95:100,
    execution_seconds_p95:100,failed_jobs:0,skipped_jobs:45,sampled_jobs:50,
    workflow_fanout_per_sha_p95:3,direct_pull_request_workflow_count:8
  },current});
  assert.equal(result.signals.skipped_rate,0.9);
  assert.equal(result.tuning.max_parallel_packages,5);
  assert.equal(result.decisions.includes('increase-safe-parallelism'),true);
  assert.equal(result.decisions.includes('reduce-fanout-and-batch-more'),false);
});

test('post-change observation cooldown blocks optimistic ratchet but not safety recovery',()=>{
  const current={max_parallel_packages:4,candidate_batch_window_seconds:20,fast_path_target_seconds:45,speculative_execution_threshold:0.75,
    updated_at:'2026-10-08T08:00:00Z',source:'daily-autonomous-optimizer',ci:{direct_pr_workflow_budget:8},safety:{}};
  const good={queue_wait_seconds_p95:5,required_queue_wait_seconds_p95:5,required_total_seconds_p95:50,
    execution_seconds_p95:50,failed_jobs:0,skipped_jobs:0,sampled_jobs:50,
    workflow_fanout_per_sha_p95:2,direct_pull_request_workflow_count:8};
  const wait=optimizeDailyTuning({metrics:good,current,observedAt:'2026-10-09T08:00:00Z'});
  assert.equal(wait.signals.cooldown_active,true);
  assert.equal(wait.tuning.max_parallel_packages,4);
  assert.equal(wait.tuning.speculative_execution_threshold,0.75);
  const recovery=optimizeDailyTuning({metrics:{...good,required_total_seconds_p95:170},current,observedAt:'2026-10-09T08:00:00Z'});
  assert.equal(recovery.tuning.max_parallel_packages,3);
  const released=optimizeDailyTuning({metrics:good,current,observedAt:'2026-10-10T14:01:00Z'});
  assert.equal(released.signals.cooldown_active,false);
  assert.equal(released.tuning.max_parallel_packages,5);
});
