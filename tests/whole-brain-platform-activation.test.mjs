import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluatePlatformActivation} from '../brain/operating-loop/platform-activation-gate.mjs';

const contract={activation:{production_ready_requires:['compatibility_mapping','regression_contract','shared_memory','health_freshness_error_owner_cost_revision','capacity_available','execution_proof','exact_revision_evidence','rollback_verified','whole_brain_lineage_verified']},platforms:[{platform:'make',capacity_gate:'required'},{platform:'portal'}],future_components:{unknown_adapter:'fail_closed',no_production_without_contract:true}};
const complete={compatibility_mapping:true,regression_contract:true,shared_memory:true,health_freshness_error_owner_cost_revision:true,capacity_available:true,execution_proof:true,exact_revision_evidence:true,rollback_verified:true,whole_brain_lineage_verified:true};

test('known platform becomes production-ready only when every required gate is true',()=>{
  const ok=evaluatePlatformActivation({platform:'portal',contract,evidence:complete});
  assert.equal(ok.productionReady,true); assert.deepEqual(ok.missing,[]);
  const bad=evaluatePlatformActivation({platform:'portal',contract,evidence:{...complete,rollback_verified:false}});
  assert.equal(bad.productionReady,false); assert.ok(bad.missing.includes('rollback_verified'));
});

test('unknown future platform fails closed until registered',()=>{
  const result=evaluatePlatformActivation({platform:'future_x',contract,evidence:complete});
  assert.equal(result.productionReady,false); assert.equal(result.status,'UNREGISTERED');
});

test('capacity-gated platform cannot activate while paused',()=>{
  const result=evaluatePlatformActivation({platform:'make',contract,evidence:{...complete,capacity_available:false}});
  assert.equal(result.productionReady,false); assert.ok(result.missing.includes('capacity_available'));
});
