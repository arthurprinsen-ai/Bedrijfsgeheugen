import test from 'node:test';
import assert from 'node:assert/strict';
import {buildScenarioRoadmapProposal} from '../portal-v2/decision-twin-receipt.js';

const tenant='tenant-evidence-1';
const state=()=>({portal:{tenant_id:tenant}});
const studio=()=>({
 days:90,
 active:{id:'revenue_growth',label:'Omzetgroei',page:'branche-markt',history:[
  {date:'2026-07-01',value:11,evidenceRef:'crm:jul'},
  {date:'2026-08-01',value:12,evidenceRef:'crm:aug'},
  {date:'2026-09-01',value:13,evidenceRef:'crm:sep'}
 ]},
 scenario:{kind:'WHAT_IF_NOT_PREDICTION',baseline:14,simulated:15.4,sensitivity:10}
});

test('valid three-source customer scenario creates only a review-only draft',()=>{
 const p=buildScenarioRoadmapProposal(state(),studio());
 assert.ok(p);
 assert.equal(p.status,'Voorgesteld');
 assert.equal(p.tenantId,tenant);
 assert.equal(p.reviewRequired,true);
 assert.equal(p.providerDispatchAllowed,false);
 assert.equal(p.outcomeVerified,false);
 assert.equal(p.expected_value,null);
 assert.equal(p.realized_value,null);
 assert.equal(p.financialStatus,'SCENARIO_ONLY');
 assert.equal(p.scenarioAssumptions.kind,'WHAT_IF_NOT_PREDICTION');
 assert.deepEqual(p.sourceRefs,['crm:jul','crm:aug','crm:sep']);
});

test('missing tenant or reference observations fails closed',()=>{
 const s=studio();
 assert.equal(buildScenarioRoadmapProposal({},s),null);
 s.active.history.splice(1,2);
 assert.equal(buildScenarioRoadmapProposal(state(),s),null);
 s.active.history.push({date:'2026-08-01',value:12},{date:'2026-09-01',value:13});
 assert.equal(buildScenarioRoadmapProposal(state(),s),null);
});

test('baseline, out-of-range, wrong horizon and fake prediction cannot be submitted',()=>{
 const s=studio();
 s.scenario.sensitivity=0;
 assert.equal(buildScenarioRoadmapProposal(state(),s),null);
 s.scenario.sensitivity=31;
 assert.equal(buildScenarioRoadmapProposal(state(),s),null);
 s.scenario.sensitivity=13;
 assert.equal(buildScenarioRoadmapProposal(state(),s),null);
 s.scenario.sensitivity=-10;
 s.days=17;
 assert.equal(buildScenarioRoadmapProposal(state(),s),null);
 s.days=90;
 s.scenario.kind='VERIFIED_OUTCOME';
 assert.equal(buildScenarioRoadmapProposal(state(),s),null);
});

test('same-tenant scenario uses stable idempotency key; repeat is not proposed',()=>{
 const p=buildScenarioRoadmapProposal(state(),studio());
 const duplicate=buildScenarioRoadmapProposal(state(),studio(),[p]);
 assert.equal(duplicate,null);
 const alternate=studio();
 alternate.scenario.sensitivity=-10;
 assert.notEqual(buildScenarioRoadmapProposal(state(),alternate,[p])?.sourceFingerprint,p.sourceFingerprint);
 assert.equal(p.sourceFingerprint.includes(tenant),true);
});

test('malformed IDs and invalid numeric assumptions remain blocked',()=>{
 const s=studio();
 s.active.id='<script>';
 assert.equal(buildScenarioRoadmapProposal(state(),s),null);
 s.active.id='revenue_growth';
 s.scenario.simulated=Number.POSITIVE_INFINITY;
 assert.equal(buildScenarioRoadmapProposal(state(),s),null);
});
