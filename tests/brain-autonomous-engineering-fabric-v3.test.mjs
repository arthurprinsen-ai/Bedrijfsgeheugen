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

test('daily optimizer holds parallelism in the neutral fanout and skip zone',()=>{
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
  assert.equal(result.tuning.max_parallel_packages,4);
  assert.equal(result.decisions.includes('increase-safe-parallelism'),false);
  assert.equal(result.decisions.includes('reduce-fanout-and-batch-more'),false);
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
