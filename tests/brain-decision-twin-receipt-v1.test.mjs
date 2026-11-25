import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDecisionTwinReceipt,renderDecisionTwinReceipt} from '../portal-v2/decision-twin-receipt.js';

const metric={
 active:{id:'revenue_growth',history:[
  {date:'2026-07-01',value:10,evidenceRef:'crm:1'},
  {date:'2026-08-01',value:11,evidenceRef:'crm:2'},
  {date:'2026-09-01',value:13,evidenceRef:'crm:3'}
 ]},
 scenario:{kind:'WHAT_IF_NOT_PREDICTION',baseline:14,simulated:15}
};
const tenant='tenant-1';
const base=()=>({portal:{tenant_id:tenant},powerhouse:{
 executive:{next_best_actions:[],outcomes:[]},
 provider_receipts:[]
}});
const action={id:'action-77',tenant_id:tenant,goal_key:'revenue_growth',source_refs:['signal:77']};
const receipt={id:'provider-12',tenant_id:tenant,action_id:'action-77',provider:'approved_provider',confirmed:true,verified_at:'2026-10-19T06:00:00Z'};
const outcome={id:'outcome-99',tenant_id:tenant,action_id:'action-77',
 verification_status:'OUTCOME_VERIFIED',source_refs:['provider:12'],verified_at:'2026-10-19T06:10:00Z',realized_effect:28};

test('empty or unsourced history never becomes an actionable forecast',()=>{
 const nothing=buildDecisionTwinReceipt({},{active:{id:'revenue_growth',history:[]},scenario:null});
 assert.equal(nothing.status,'INSUFFICIENT_EVIDENCE');
 const unsourced=structuredClone(metric);unsourced.active.history.forEach(x=>delete x.evidenceRef);
 assert.equal(buildDecisionTwinReceipt(base(),unsourced).status,'INSUFFICIENT_EVIDENCE');
});
test('customer data remains scenario only until exact scoped, source-backed action exists',()=>{
 const state=base();
 assert.equal(buildDecisionTwinReceipt(state,metric).status,'SIMULATION_ONLY');
 state.powerhouse.executive.next_best_actions.push({...action,tenant_id:'tenant-other'});
 assert.equal(buildDecisionTwinReceipt(state,metric).status,'SIMULATION_ONLY');
 state.powerhouse.executive.next_best_actions=[{...action,source_refs:[]}];
 assert.equal(buildDecisionTwinReceipt(state,metric).status,'SIMULATION_ONLY');
 state.powerhouse.executive.next_best_actions=[action];
 const result=buildDecisionTwinReceipt(state,metric);
 assert.equal(result.status,'ACTION_PROPOSED');
 assert.equal(result.actionId,'action-77');
 assert.equal(result.estimatedEffect,null);
 assert.equal(result.realizedEffect,null);
});
test('provider status strings cannot fabricate execution without scoped signed receipt',()=>{
 const state=base();state.powerhouse.executive.next_best_actions=[{...action,status:'COMPLETED'}];
 state.powerhouse.provider_receipts=[{...receipt,confirmed:false}, {...receipt,tenant_id:'other'}];
 assert.equal(buildDecisionTwinReceipt(state,metric).status,'ACTION_PROPOSED');
 state.powerhouse.provider_receipts=[receipt];
 assert.equal(buildDecisionTwinReceipt(state,metric).status,'PROVIDER_CONFIRMED');
});
test('independent tenant-scoped outcome verification is needed for realized label',()=>{
 const state=base();state.powerhouse.executive.next_best_actions=[action];
 state.powerhouse.provider_receipts=[receipt];
 state.powerhouse.executive.outcomes=[{...outcome,source_refs:[]}];
 assert.equal(buildDecisionTwinReceipt(state,metric).status,'PROVIDER_CONFIRMED');
 state.powerhouse.executive.outcomes=[outcome];
 const result=buildDecisionTwinReceipt(state,metric);
 assert.equal(result.status,'OUTCOME_VERIFIED');
 assert.equal(result.realizedEffect,28);
 assert.equal(result.outcomeId,'outcome-99');
 assert.equal(result.scenarioKind,'WHAT_IF_NOT_PREDICTION');
});
test('HTML output escapes external IDs and never labels what-if as causal proof',()=>{
 const html=renderDecisionTwinReceipt({status:'ACTION_PROPOSED',actionId:'<script>alert(1)</script>',sourceRefs:['crm:1']});
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(!html.includes('<script>'));
 assert.ok(html.includes('Gerealiseerd effect: nog niet onafhankelijk gemeten'));
});
