import test from 'node:test';
import assert from 'node:assert/strict';
import {materialSignals} from '../portal-v2/operating-system/monitoring.js';
import {classifyActionRisk,evaluateActionEligibility,transitionAction} from '../portal-v2/operating-system/action-policy.js';
import {recordDecision} from '../portal-v2/operating-system/decision-model.js';
import {calibrateOutcome} from '../portal-v2/operating-system/learning.js';
import {createScenario,simulateScenario} from '../portal-v2/operating-system/scenario-engine.js';
import {buildCapabilityGraph} from '../portal-v2/operating-system/capability-graph.js';

test('closed loop connects material signal, governed action, outcome and learning',()=>{
 const signal={type:'kpi',entity_id:'conversion',delta:-15,confidence:.9,observed_at:'2026-09-16T18:00:00Z'};
 assert.equal(materialSignals([signal],{min_abs_delta:10,min_confidence:.5}).length,1);
 const action={id:'a1',internal:true,reversible:true,tenant_id:'t1',provenance:'powerhouse',identity_verified:true,permission_verified:true,state:'PROPOSED'};
 const risk=classifyActionRisk(action);assert.equal(risk,1);
 const eligibility=evaluateActionEligibility({...action,risk_class:risk},{});assert.equal(eligibility.state,'AUTO_APPROVED');
 let current={...action,risk_class:risk,state:'AUTO_APPROVED'};
 for(const next of ['QUEUED','EXECUTING','READBACK_PENDING','VERIFIED','OUTCOME_PENDING','OUTCOME_RECORDED','LEARNED'])current=transitionAction(current,next,{now:'2026-09-16T20:00:00Z'});
 assert.equal(current.state,'LEARNED');
 const decision=recordDecision({action_id:'a1',decision:'accept',actor:'user-1',evidence_snapshot:{signal:'conversion'}});assert.equal(decision.decision,'accept');
 const calibration=calibrateOutcome({amount:100,kind:'estimated'},{amount:90,kind:'realized'},[]);assert.equal(calibration.error,-10);
});

test('scenario remains non-destructive and can feed capability impact graph',()=>{
 const baseline={id:'b1',kpis:{revenue:100,capacity:10,risk:20}};const original=JSON.stringify(baseline);
 const scenario=createScenario({baselineRef:'b1',assumptions:{revenue_pct:15},affectedCapabilities:['sales']});
 const simulated=simulateScenario(baseline,scenario);assert.equal(simulated.kpis.revenue,115);assert.equal(JSON.stringify(baseline),original);
 const graph=buildCapabilityGraph({capabilities:{sales:{n:'Sales',proc:['Lead'],sys:['CRM'],data:['Klant'],ai:[],gov:[],kpi:['Conversie'],proj:[]}},actions:[{id:'a1',capability_id:'sales'}],outcomes:[{id:'o1',action_id:'a1'}]});
 assert.ok(graph.edges.some(edge=>edge.from==='capability:sales'&&edge.to==='action:a1'));
 assert.ok(graph.edges.some(edge=>edge.from==='action:a1'&&edge.to==='outcome:o1'));
});

test('synthetic actor identity is rejected',()=>{
 assert.throws(()=>recordDecision({action_id:'a1',decision:'accept',actor:'authenticated-user'}),/DECISION_ACTOR_REQUIRED/);
});
