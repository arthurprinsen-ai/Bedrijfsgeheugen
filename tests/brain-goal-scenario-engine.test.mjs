import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGoalScenario,buildGoalScenarios,GOAL_LEVERS} from '../brain/context/goal-scenario-engine.mjs';

test('goal scenario separates observed-history forecast from what-if assumptions',()=>{
  const state={portal:{business_context:{goals:['cash'],goal_targets:{cash:{current_value:18,target_value:30,target_date:'2027-03-22'}},goal_scenarios:{cash:{levers:{dso:{effect:4},'working-capital':{effect:3,source_refs:['e1']}}}}},goal_history:{cash:[
    {date:'2026-01-01',value:8},{date:'2026-04-01',value:11},{date:'2026-07-01',value:15},{date:'2026-09-01',value:18}
  ]}}};
  const result=buildGoalScenario(state,'cash',{now:'2026-09-22T12:00:00Z'});
  assert.equal(result.forecastStatus,'available');
  assert.equal(result.truth.scenario,'what-if-assumptions-not-prediction');
  assert.equal(result.truth.quantifiedEffects,2);
  assert.equal(result.truth.evidenceLinkedEffects,1);
  assert.ok(result.scenarioExpected>result.baselineExpected);
  assert.equal(result.nextBestActions[0].leverId,'dso');
});

test('without quantified assumptions Powerhouse suggests levers without inventing impact',()=>{
  const state={portal:{business_context:{goals:['profit'],goal_targets:{profit:{current_value:8,target_value:14,target_date:'2027-09-22'}}}}};
  const result=buildGoalScenario(state,'profit',{now:'2026-09-22T12:00:00Z'});
  assert.equal(result.truth.quantifiedEffects,0);
  assert.equal(result.nextBestActions.length,3);
  assert.ok(result.nextBestActions.every(item=>item.effect===null));
  assert.ok(result.nextBestActions.every(item=>item.evidenceMode==='suggested-not-quantified'));
});

test('multiple goals keep separate lever catalogs and scenarios',()=>{
  const state={portal:{business_context:{goals:['valuation','exit'],goal_targets:{
    valuation:{current_value:2000000,target_value:3000000,target_date:'2028-09-22'},
    exit:{current_value:45,target_value:80,target_date:'2027-09-22'}
  },goal_scenarios:{
    valuation:{levers:{ebitda:{effect:250000}}},
    exit:{levers:{transferability:{effect:12}}}
  }}}};
  const scenarios=buildGoalScenarios(state,['valuation','exit'],{now:'2026-09-22T12:00:00Z'});
  assert.deepEqual(scenarios.map(x=>x.goalId),['valuation','exit']);
  assert.equal(scenarios[0].scenarioExpected,2250000);
  assert.equal(scenarios[1].scenarioExpected,57);
  assert.ok(GOAL_LEVERS.valuation.some(x=>x.id==='multiple-risk'));
});
