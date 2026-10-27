import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyDeliveryImpact, planConcurrentAgentWork} from '../tools/delivery/predictive-controller.mjs';

test('cross-lane CMS source changes affect website preflight',()=>{
  const impact=classifyDeliveryImpact(['cms/story.md']);
  assert.deepEqual(impact.lanes,['website','cms']);
  assert.deepEqual(impact.crossLaneContracts,['cms-to-website']);
  assert.equal(impact.maySkipProtectedChecks,false);
});

test('shared Brain contract propagates to consumers without duplicate lanes',()=>{
  const impact=classifyDeliveryImpact(['brain/contracts/identity.json','brain/contracts/identity.json']);
  assert.deepEqual(impact.lanes,['portal','one-brain','powerhouse','heartbeat']);
  assert.deepEqual(impact.crossLaneContracts,['brain-contract-to-consumers']);
});

test('Supabase schema affects dependent runtime consumers; unrelated website stays scoped',()=>{
  assert.deepEqual(classifyDeliveryImpact(['supabase/migrations/20261023.sql']).lanes,
    ['backend-supabase','portal','one-brain','heartbeat']);
  assert.deepEqual(classifyDeliveryImpact(['src/home.tsx']).lanes,['website']);
});

test('unknown and unsafe paths always trigger full preflight, not a silent bypass',()=>{
  for(const paths of [[],['package.json'],['../secret'],['/absolute']]){
    const impact=classifyDeliveryImpact(paths);
    assert.equal(impact.preflightMode,'FULL_CROSS_LANE_PREFLIGHT');
    assert.deepEqual(impact.lanes,['website','backend-supabase','portal','cms','one-brain','powerhouse','heartbeat']);
    assert.equal(impact.maySkipProtectedChecks,false);
  }
});

test('every planner result includes impact, including blocked optional queue dispatch',()=>{
  const healthy=planConcurrentAgentWork({changedPaths:['src/home.tsx']});
  assert.deepEqual(healthy.deliveryImpact.lanes,['website']);
  const held=planConcurrentAgentWork({changedPaths:['cms/story.md'],queue:{queued:20}});
  assert.equal(held.state,'BATCH_BEFORE_MUTATION');
  assert.deepEqual(held.deliveryImpact.lanes,['website','cms']);
  assert.deepEqual(held.deliveryImpact.mandatoryProtectedChecks,['hygiene / admission','test','CodeQL javascript-typescript']);
});
