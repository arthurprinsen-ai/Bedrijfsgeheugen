import test from 'node:test';
import assert from 'node:assert/strict';
import {buildGoalForecast,buildGoalForecasts,buildJourneyProgress} from '../brain/context/goal-forecast-engine.mjs';
import {buildBusinessContext} from '../brain/context/business-context-engine.mjs';

test('goal forecast refuses false precision without at least three observations',()=>{
  const state={portal:{business_context:{goals:['profit'],goal_targets:{profit:{current_value:8,target_value:15,target_date:'2027-09-22'}}},goal_history:{profit:[
    {date:'2026-06-01',value:6},{date:'2026-09-01',value:8}
  ]}}};
  const result=buildGoalForecast(state,'profit',{now:'2026-09-22T12:00:00Z'});
  assert.equal(result.forecast,null);
  assert.equal(result.forecastStatus,'insufficient-evidence');
  assert.equal(result.historyPoints,2);
  assert.ok(result.requiredPace);
});

test('goal forecast produces expectation band from observed history',()=>{
  const state={portal:{business_context:{goals:['revenue_growth'],goal_targets:{revenue_growth:{current_value:18,target_value:30,target_date:'2027-03-22'}}},goal_history:{revenue_growth:[
    {date:'2026-01-01',value:10},{date:'2026-04-01',value:13},{date:'2026-07-01',value:16},{date:'2026-09-01',value:18}
  ]}}};
  const result=buildGoalForecast(state,'revenue_growth',{now:'2026-09-22T12:00:00Z'});
  assert.equal(result.forecastStatus,'available');
  assert.equal(result.forecast.points,4);
  assert.ok(Number.isFinite(result.forecast.expected));
  assert.ok(result.forecast.lower<=result.forecast.expected);
  assert.ok(result.forecast.upper>=result.forecast.expected);
});

test('journey shows current and desired business stage without claiming time-only progress',()=>{
  const state={portal:{business_context:{stage:'grow',target_stage:'professionalize'}}};
  const context=buildBusinessContext(state);
  const journey=buildJourneyProgress(state,context);
  assert.equal(journey.current,'grow');
  assert.equal(journey.target,'professionalize');
  assert.deepEqual(journey.stages,['grow','scale','professionalize']);
  assert.match(journey.note,/milestones en outcomes/i);
});

test('Powerhouse business context carries goal forecasts and target journey',()=>{
  const state={portal:{business_context:{
    stage:'scale',target_stage:'mature',goals:['cash'],
    goal_targets:{cash:{current_value:18,target_value:40,target_date:'2027-03-22'}}
  },goal_history:{cash:[
    {date:'2026-01-01',value:8},{date:'2026-04-01',value:11},{date:'2026-07-01',value:15},{date:'2026-09-01',value:18}
  ]}}};
  const context=buildBusinessContext(state);
  assert.equal(context.schemaVersion,'business-context.v3');
  assert.equal(context.targetJourney.target,'mature');
  assert.equal(context.goalForecasts.length,1);
  assert.equal(context.goalForecasts[0].goalId,'cash');
  assert.equal(context.goalForecasts[0].forecastStatus,'available');
});

test('multiple goals forecast independently in the same company context',()=>{
  const state={portal:{business_context:{goals:['profit','valuation'],goal_targets:{
    profit:{current_value:10,target_value:16,target_date:'2027-09-22'},
    valuation:{current_value:2000000,target_value:3000000,target_date:'2028-09-22'}
  }}}};
  const forecasts=buildGoalForecasts(state,['profit','valuation'],{now:'2026-09-22T12:00:00Z'});
  assert.deepEqual(forecasts.map(x=>x.goalId),['profit','valuation']);
  assert.ok(forecasts.every(x=>x.forecastStatus==='insufficient-evidence'));
});
