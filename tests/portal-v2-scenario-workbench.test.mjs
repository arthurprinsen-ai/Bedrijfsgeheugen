import test from 'node:test';
import assert from 'node:assert/strict';
import {buildScenarioWorkbenchModel,calculateScenario,WORKBENCH_DOMAINS,mountScenarioWorkbench} from '../portal-v2/scenario-workbench.js';

const companyState={
 portal:{
  business_context:{goal_targets:{automate:{history:[
   {date:'2026-06-01',value:300},{date:'2026-07-01',value:290},{date:'2026-08-01',value:280}
  ]}}},
  heartbeat:{observations:[{observed_at:'2026-10-15',status:'WARN'}]},
  brain:{decisions:[{id:'D-1',source_ref:'evidence-1'}]},
  actions:[{id:'A-1'}]
 }
};
const context={
 goalForecasts:[{goalId:'automate',metric:'manual_hours_year',label:'Handmatig werk',unit:'uur/jaar',current:280,
   target:240,targetDate:'2026-12-31',forecastStatus:'available',forecast:{expected:260,lower:250,upper:270,method:'linear-trend'},evidence:{historyPoints:3}}],
 goalScenarios:[{goalId:'automate',levers:[
  {id:'integration',label:'Koppelingen',effect:-20,evidenceMode:'scenario-assumption'},
  {id:'workflow',label:'Workflow',effect:-10,evidenceMode:'evidence-linked',sourceRefs:['DOC-1']},
  {id:'ai',label:'AI',effect:null}
 ]}]
};
test('all eight domains are available but missing domains never invent predictions',()=>{
 const model=buildScenarioWorkbenchModel(companyState,context);
 assert.equal(WORKBENCH_DOMAINS.length,8);
 assert.equal(model.goals.length,1);
 assert.equal(model.domains.find(d=>d.id==='commercial').readyCount,0);
 assert.equal(model.domains.find(d=>d.id==='operations').readyCount,1);
 assert.equal(model.coverage.find(s=>s.id==='heartbeat').paths.length,1);
 assert.equal(model.coverage.find(s=>s.id==='brain').paths.length,1);
 assert.equal(model.coverage.find(s=>s.id==='customer').paths.length,0);
});
test('scenario lever effects are explicit assumptions; baseline stays unaltered',()=>{
 const goal=buildScenarioWorkbenchModel(companyState,context).goals[0];
 assert.deepEqual([calculateScenario(goal,'baseline').scenario,calculateScenario(goal,'cautious').scenario,calculateScenario(goal,'ambitious').scenario],[260,245,222.5]);
 assert.equal(calculateScenario(goal,'custom',1).scenario,230);
 assert.equal(calculateScenario(goal,'custom',1).evidenceLinked,1);
});
test('a missing validated trend or quantified lever never becomes a made-up forecast',()=>{
 const empty=buildScenarioWorkbenchModel({},{});assert.equal(empty.goals.length,0);
 assert.equal(calculateScenario(null,'ambitious').scenario,null);
 const ungrounded={...context,goalForecasts:[{...context.goalForecasts[0],forecastStatus:'insufficient-evidence'}]};
 const unverified=buildScenarioWorkbenchModel(companyState,ungrounded).goals[0];
 assert.equal(unverified.expected,null);
 assert.equal(calculateScenario(unverified,'ambitious').scenario,null);
 const noLever={...unverified,expected:260,levers:[]};
 assert.equal(calculateScenario(noLever,'ambitious').scenario,null);
});
test('workbench escapes customer labels and exposes only tenant-snapshot evidence',()=>{
 const unsafe={...context,goalForecasts:[{...context.goalForecasts[0],label:'<script>alert(1)</script>'}]};
 const host={innerHTML:''};
 mountScenarioWorkbench(host,{state:companyState,context:unsafe});
 assert.ok(host.innerHTML.includes('&lt;script&gt;'));
 assert.ok(!host.innerHTML.includes('<script>'));
 assert.ok(host.innerHTML.includes('Heartbeat'));
});
