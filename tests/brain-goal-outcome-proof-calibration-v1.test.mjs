import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGoalOutcomeLearning,calibrationFor} from '../brain/context/goal-outcome-learning.mjs';
import {buildGoalScenario} from '../brain/context/goal-scenario-engine.mjs';

const goal='profit',lever='gross-margin';
const outcome=(id,proof,overrides={})=>({
  id,goalId:goal,leverId:lever,expectedEffect:2,realizedEffect:1.5,
  status:'VERIFIED',evidenceIds:proof,...overrides
});
const state=items=>({portal:{outcomes:items}});
const ratio=items=>calibrationFor(state(items),goal,lever);

test('historical replay: three distinct outcome receipts permit bounded calibration',()=>{
  const result=ratio([outcome('1',['a']),outcome('2',['b']),outcome('3',['c'])]);
  assert.equal(result.calibrationStatus,'available');
  assert.equal(result.verifiedObservations,3);
  assert.equal(result.calibrationFactor,0.75);
});

test('shadow: status-only, raw source refs or receipt-only records cannot train the model',()=>{
  const statusOnly=[1,2,3].map(id=>outcome(String(id),[]));
  assert.equal(ratio(statusOnly).calibrationFactor,null);
  const inputOnly=[1,2,3].map(id=>outcome(String(id),[],{sourceRefs:['input-'+id]}));
  assert.equal(ratio(inputOnly).verifiedObservations,0);
  const receiptOnly=[1,2,3].map(id=>outcome(String(id),['proof-'+id],{status:'PENDING'}));
  assert.equal(ratio(receiptOnly).calibrationStatus,'insufficient-evidence');
  assert.equal(ratio([outcome('a',['r1'],{status:'REJECTED',verified:true}),
    outcome('b',['r2']),outcome('c',['r3'])]).calibrationFactor,null);
  assert.equal(ratio([outcome('a',['r1'],{status:'COMPLETED'}),
    outcome('b',['r2'],{status:'COMPLETED'}),outcome('c',['r3'],{status:'COMPLETED'})]).calibrationFactor,null);
});

test('shadow: replayed IDs and receipts do not inflate observations or other levers',()=>{
  assert.equal(ratio([outcome('1',['r1']),outcome('1',['r2']),outcome('3',['r3'])]).verifiedObservations,2);
  const repeated=state([outcome('1',['r1']),outcome('2',['r1']),outcome('3',['r3'])]);
  assert.equal(buildGoalOutcomeLearning(repeated,goal).verifiedOutcomes,2);
  assert.equal(ratio(repeated).calibrationFactor,null);
  const mixed=state([
    outcome('1',['shared']),
    outcome('2',['proof-2']),
    {...outcome('3',['shared']),leverId:'cost-to-serve'},
    {...outcome('4',['proof-4']),leverId:'cost-to-serve'},
    {...outcome('5',['proof-5']),leverId:'cost-to-serve'}
  ]);
  const learning=buildGoalOutcomeLearning(mixed,goal);
  assert.equal(learning.verifiedOutcomes,4);
  assert.equal(learning.calibrations.find(x=>x.leverId==='cost-to-serve').verifiedObservations,2);
});

test('canary: missing, blank, non-finite and unquantified effects remain unknown',()=>{
  const items=[
    outcome('a',['pa'],{realizedEffect:null}),
    outcome('b',['pb'],{realizedEffect:''}),
    outcome('c',['pc'],{realizedEffect:'infinite'}),
    outcome('d',['pd'],{expectedEffect:0})
  ];
  const result=buildGoalOutcomeLearning(state(items),goal);
  assert.equal(result.records[0].realizedEffect,null);
  assert.equal(result.records[1].realizedEffect,null);
  assert.equal(result.records[2].realizedEffect,null);
  assert.equal(result.records[3].ratio,null);
  assert.equal(ratio(items).calibrationStatus,'insufficient-evidence');
});

test('canary: no unverified proof is displayed as evidence-adjusted scenario',()=>{
  const input={portal:{
    business_context:{goals:[goal],goal_targets:{[goal]:{current_value:8,target_value:15,target_date:'2027-09-22'}},
      goal_scenarios:{[goal]:{levers:{[lever]:{effect:2}}}}},
    outcomes:[outcome('a',[]),outcome('b',[]),outcome('c',[])]
  }};
  const scenario=buildGoalScenario(input,goal,{now:'2026-09-22T12:00:00Z'});
  const margin=scenario.levers.find(x=>x.id===lever);
  assert.equal(margin.calibration.calibrationStatus,'insufficient-evidence');
  assert.equal(margin.evidenceAdjustedEffect,null);
  assert.equal(scenario.truth.calibratedEffects,0);
});
