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
