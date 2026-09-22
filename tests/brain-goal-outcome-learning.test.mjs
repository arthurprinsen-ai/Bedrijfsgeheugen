import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGoalOutcomeLearning,calibrationFor} from '../brain/context/goal-outcome-learning.mjs';
import {buildGoalScenario} from '../brain/context/goal-scenario-engine.mjs';

test('goal outcome learning requires three verified outcomes before calibration',()=>{
  const state={portal:{outcomes:[
    {goalId:'profit',leverId:'gross-margin',expectedEffect:2,realizedEffect:1.6,status:'VERIFIED'},
    {goalId:'profit',leverId:'gross-margin',expectedEffect:2,realizedEffect:1.8,status:'VERIFIED'}
  ]}};
  const learning=buildGoalOutcomeLearning(state,'profit');
  assert.equal(learning.records.length,2);
  const calibration=calibrationFor(state,'profit','gross-margin');
  assert.equal(calibration.calibrationFactor,null);
  assert.equal(calibration.calibrationStatus,'insufficient-evidence');
});

test('verified goal outcomes produce bounded historical calibration',()=>{
  const state={portal:{outcomes:[
    {goalId:'profit',leverId:'gross-margin',expectedEffect:2,realizedEffect:1.6,status:'VERIFIED',evidenceIds:['e1']},
    {goalId:'profit',leverId:'gross-margin',expectedEffect:2,realizedEffect:1.8,status:'VERIFIED',evidenceIds:['e2']},
    {goalId:'profit',leverId:'gross-margin',expectedEffect:2,realizedEffect:1.7,status:'VERIFIED',evidenceIds:['e3']}
  ]}};
  const calibration=calibrationFor(state,'profit','gross-margin');
  assert.equal(calibration.calibrationStatus,'available');
  assert.equal(calibration.verifiedObservations,3);
  assert.ok(calibration.calibrationFactor>0);
  assert.ok(calibration.calibrationFactor<=2);
});

test('goal scenario exposes evidence-adjusted effect without rewriting raw assumption',()=>{
  const state={portal:{
    business_context:{
      goals:['profit'],
      goal_targets:{profit:{current_value:8,target_value:15,target_date:'2027-09-22'}},
      goal_scenarios:{profit:{levers:{'gross-margin':{effect:2}}}}
    },
    outcomes:[
      {goalId:'profit',leverId:'gross-margin',expectedEffect:2,realizedEffect:1,status:'VERIFIED'},
      {goalId:'profit',leverId:'gross-margin',expectedEffect:2,realizedEffect:1.2,status:'VERIFIED'},
      {goalId:'profit',leverId:'gross-margin',expectedEffect:2,realizedEffect:1.4,status:'VERIFIED'}
    ]
  }};
  const scenario=buildGoalScenario(state,'profit',{now:'2026-09-22T12:00:00Z'});
  const lever=scenario.levers.find(x=>x.id==='gross-margin');
  assert.equal(lever.effect,2);
  assert.ok(Number.isFinite(lever.evidenceAdjustedEffect));
  assert.notEqual(lever.evidenceAdjustedEffect,lever.effect);
  assert.equal(lever.calibration.calibrationStatus,'available');
  assert.ok(Number.isFinite(scenario.evidenceAdjustedScenarioExpected));
});
