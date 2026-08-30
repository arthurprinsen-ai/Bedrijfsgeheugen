import test from 'node:test';
import assert from 'node:assert/strict';
import { projectDeliveryState } from '../platform/delivery/current-state.mjs';
import { isMaterialDeliveryEvent, fingerprintDeliveryEvent } from '../platform/delivery/learning-events.mjs';
import { decideProductionActivation } from '../platform/delivery/production-authority.mjs';

const materialKinds=['CHANGE_PROPOSED','CHANGE_GREEN','CHANGE_PROMOTED','CHANGE_SUPERSEDED','CONFLICT_RECONCILED','PLATFORM_REGISTERED','PRODUCTION_ROLLBACK','CONTRACT_CHANGE'];

test('BG167-compatible projection exposes active changes and cross-platform dependencies',()=>{
  const state=projectDeliveryState({changes:[
    {changeId:'git-1',owner:'agent-web',platform:'github',state:'TESTING',contractKeys:['nav:v2']},
    {changeId:'supa-1',owner:'agent-data',platform:'supabase',state:'RECONCILE_REQUIRED',contractKeys:['portal-state:v4'],dependsOn:['portal-2']}
  ]});
  assert.equal(state.active_changes.length,2);
  assert.deepEqual(state.change_dependencies,[{changeId:'supa-1',dependsOn:['portal-2']}]);
  assert.deepEqual(state.conflict_states,[{changeId:'supa-1',state:'RECONCILE_REQUIRED'}]);
  assert.deepEqual(state.production_promotions,[]);
});

test('BG168-compatible delivery event set is material and deterministically fingerprinted',()=>{
  for(const kind of materialKinds)assert.equal(isMaterialDeliveryEvent(kind),true,kind);
  assert.equal(isMaterialDeliveryEvent('DEBUG_LOG'),false);
  const a=fingerprintDeliveryEvent({kind:'CHANGE_PROMOTED',platform:'netlify',changeId:'chg-1',candidateVersion:'abc'});
  const b=fingerprintDeliveryEvent({candidateVersion:'abc',changeId:'chg-1',platform:'netlify',kind:'CHANGE_PROMOTED'});
  assert.equal(a,b);
});

test('BG169-compatible authority promotes every independently green exact candidate immediately',()=>{
  const decision=decideProductionActivation({platform:'notion',registered:true,gatesGreen:true,dependenciesGreen:true,exactEvidence:true,hardBoundary:false,productionRegressed:false});
  assert.equal(decision.action,'PROMOTE');
  assert.equal(decision.waitForUnrelatedChanges,false);
  assert.equal(decision.batchRequired,false);
});

test('production authority blocks only true hard boundaries and rejects missing evidence',()=>{
  assert.equal(decideProductionActivation({platform:'make',registered:true,gatesGreen:true,dependenciesGreen:true,exactEvidence:true,hardBoundary:true}).action,'BLOCKED_HARD_BOUNDARY');
  assert.equal(decideProductionActivation({platform:'supabase',registered:true,gatesGreen:true,dependenciesGreen:true,exactEvidence:false,hardBoundary:false}).action,'REJECT');
  assert.equal(decideProductionActivation({platform:'unknown',registered:false,gatesGreen:true,dependenciesGreen:true,exactEvidence:true,hardBoundary:false}).action,'REJECT');
});

test('a production regression requests the narrow rollback path',()=>{
  assert.equal(decideProductionActivation({platform:'netlify',registered:true,gatesGreen:true,dependenciesGreen:true,exactEvidence:true,hardBoundary:false,productionRegressed:true}).action,'ROLLBACK');
});
