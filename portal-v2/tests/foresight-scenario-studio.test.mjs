import test from 'node:test';
import assert from 'node:assert/strict';
import { buildForesightStudioModel } from '../foresight-scenario-studio.js';

const history=[
  {date:'2026-06-01',value:3,source:'CRM',evidenceRef:'crm:1'},
  {date:'2026-07-01',value:5,source:'CRM',evidenceRef:'crm:2'},
  {date:'2026-08-01',value:6,source:'CRM',evidenceRef:'crm:3'},
  {date:'2026-09-01',value:7,source:'CRM',evidenceRef:'crm:4'}
];
const state={
  portal:{
    business_context:{
      goal_targets:{
        revenue_growth:{current_value:7,target_value:11,target_date:'2027-01-01',history}
      }
    }
  }
};

test('empty tenant has no fabricated forecast, no scenario and seven accountable domains',()=>{
 const model=buildForesightStudioModel({});
 assert.equal(model.available,0);
 assert.equal(model.scenario,null);
 assert.equal(model.metrics.length,7);
 assert.ok(model.metrics.every(row=>row.quality==='INSUFFICIENT_HISTORY'));
});

test('uses only chronological customer history and retains metadata',()=>{
 const model=buildForesightStudioModel(state,{metric:'revenue_growth',days:90});
 assert.equal(model.available,1);
 assert.equal(model.active.history.length,4);
 assert.equal(model.active.evidenceCount,4);
 assert.equal(model.active.forecast.method,'linear-trend');
 assert.ok(Number.isFinite(model.active.forecast.expected));
 assert.equal(model.active.quality,'EXPLORATORY_TREND');
 assert.equal(model.scenario.kind,'WHAT_IF_NOT_PREDICTION');
});

test('scenario sensitivity is explicit and does not change baseline forecast',()=>{
 const asOf='2026-10-15T00:00:00Z'; // compare exactly the same observation cutoff
 const base=buildForesightStudioModel(state,{metric:'revenue_growth',days:90,sensitivity:0,asOf});
 const downside=buildForesightStudioModel(state,{metric:'revenue_growth',days:90,sensitivity:-10,asOf});
 const upside=buildForesightStudioModel(state,{metric:'revenue_growth',days:90,sensitivity:10,asOf});
 assert.equal(base.scenario.baseline,downside.scenario.baseline);
 assert.equal(base.scenario.baseline,upside.scenario.baseline);
 assert.ok(downside.scenario.simulated<base.scenario.baseline);
 assert.ok(upside.scenario.simulated>base.scenario.baseline);
 assert.equal(buildForesightStudioModel(state,{sensitivity:500}).scenario.sensitivity,30);
});

test('different horizon changes projection without changing observed data',()=>{
 const near=buildForesightStudioModel(state,{metric:'revenue_growth',days:30});
 const later=buildForesightStudioModel(state,{metric:'revenue_growth',days:365});
 assert.notEqual(near.scenario.baseline,later.scenario.baseline);
 assert.deepEqual(near.active.history,later.active.history);
});

test('single point, duplicate date and invalid value cannot authorize forecast',()=>{
 const bad={
  portal:{business_context:{goal_targets:{automate:{
   history:[
    {date:'2026-07-01',value:'not-a-number'},
    {date:'2026-07-02',value:5},
    {date:'2026-07-02T08:00:00Z',value:6},
    {date:'2026-07-03',value:null}
   ]
  }}}}
 };
 const model=buildForesightStudioModel(bad,{metric:'automate'});
 assert.equal(model.active.forecast,null);
 assert.equal(model.scenario,null);
 assert.equal(model.available,0);
});

test('no cross-tenant global Powerhouse and no raw platform Heartbeat promotion',()=>{
 const alien={
  ...state,
  powerhouse_forecasts:[{scope:'platform',predicted_event:'SALE',confidence:1}],
  heartbeat:{status:'GREEN_VERIFIED',tenantId:'another-tenant'},
  brain:{forecast:{expected:1000000}},
  portal:{...state.portal,foresight:{heartbeat:{tenantId:'another-tenant',status:'GREEN_VERIFIED'}}}
 };
 const model=buildForesightStudioModel(alien,{metric:'revenue_growth'});
 assert.equal(model.available,1);
 assert.equal(model.intelligence.heartbeat,'Tenantgebonden Heartbeat nog niet geverifieerd');
 assert.equal(model.active.source,'Klantgebonden historie in bestaande portaalcontext');
 assert.ok(model.metrics.every(x=>x.label!=='SALE'));
});

test('missing history must not turn a customer KPI value into a predicted path',()=>{
 const raw={portal:{finance:{revenue_growth_pct:42},metrics:{manual_hours_year:1000}}};
 const model=buildForesightStudioModel(raw,{metric:'revenue_growth'});
 assert.equal(model.active.forecast,null);
 assert.equal(model.active.history.length,0);
 assert.equal(model.scenario,null);
});

test('horizons run from selected as-of date rather than stale last observation',()=>{
 const model=buildForesightStudioModel(state,{metric:'revenue_growth',days:90,asOf:'2026-10-15T00:00:00Z'});
 assert.equal(model.active.forecast.forecastFor,'2027-01-13');
 const stale=buildForesightStudioModel(state,{metric:'revenue_growth',days:90,asOf:'2027-03-01T00:00:00Z'});
 assert.equal(stale.active.forecast,null);
 assert.equal(stale.scenario,null);
});

test('favourable scenario reduces metrics whose goal direction is down',()=>{
 const descendingGoal={
  portal:{business_context:{goal_targets:{automate:{
   history:[
    {date:'2026-06-01',value:120,evidenceRef:'ops-1'},
    {date:'2026-07-01',value:115,evidenceRef:'ops-2'},
    {date:'2026-08-01',value:110,evidenceRef:'ops-3'},
    {date:'2026-09-01',value:105,evidenceRef:'ops-4'}
   ],
   target_value:80,target_date:'2027-01-01'
  }}}}
 };
 const common={metric:'automate',days:90,asOf:'2026-10-15T00:00:00Z'};
 const baseline=buildForesightStudioModel(descendingGoal,{...common,sensitivity:0});
 const favourable=buildForesightStudioModel(descendingGoal,{...common,sensitivity:10});
 const adverse=buildForesightStudioModel(descendingGoal,{...common,sensitivity:-10});
 assert.equal(favourable.active.direction,'down');
 assert.equal(favourable.scenario.baseline,baseline.scenario.baseline);
 assert.equal(adverse.scenario.baseline,baseline.scenario.baseline);
 assert.ok(favourable.scenario.simulated<baseline.scenario.baseline);
 assert.ok(adverse.scenario.simulated>baseline.scenario.baseline);
 assert.ok(Math.abs(favourable.scenario.delta+Math.abs(baseline.scenario.baseline)*0.1)<1e-9);
});

test('positive scenario improves a negative baseline instead of making it more negative',()=>{
 const loss={portal:{business_context:{goal_targets:{profit:{history:[
  {date:'2026-06-01',value:-20},
  {date:'2026-07-01',value:-19},
  {date:'2026-08-01',value:-18},
  {date:'2026-09-01',value:-17}
 ]}}}}};
 const options={metric:'profit',days:30,asOf:'2026-10-15T00:00:00Z'};
 const baseline=buildForesightStudioModel(loss,options);
 const upside=buildForesightStudioModel(loss,{...options,sensitivity:20});
 assert.ok(baseline.scenario.baseline<0);
 assert.ok(upside.scenario.simulated>baseline.scenario.baseline);
});
