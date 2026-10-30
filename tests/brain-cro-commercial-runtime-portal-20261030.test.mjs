import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectOtherData,projectCroBrainProof} from '../netlify/functions/powerhouse-cro-other-data.mjs';
const at='2026-10-30T08:20:00.000Z';
const g=['BRAIN_DELIVERY_READBACK','FIRST_PARTY_EVENT_RECEIPT','ACTUAL_CTA_EXPOSURE',
 'CONTROLLED_CRO_EXPERIMENT','QUALIFIED_BUYER_READBACK','PAID_ORDER_READBACK','ONE_BRAIN_LEARNING_APPLIED'];
function record(overrides={}){
 return {record_id:'cro-commercial-evidence:2026-10-30',record_type:'Verification',record_kind:'verification',
  owner_id:'powerhouse-commercial-heartbeat-runner',executed:true,verified:false,status:'OBSERVED',
  observed_at:'2026-10-30T08:15:00.000Z',
  payload:{contract:'POWERHOUSE_CRO_COMMERCIAL_CLOSURE_V1',status:'EVIDENCE_INCOMPLETE',
   gates:g.map(gate=>({gate,verified:gate==='ACTUAL_CTA_EXPOSURE'})),
   observed:{ctaEvents7d:2,maturedTreatment:1,maturedHoldout:0,linkedLeadRecords30d:0}},
  ...overrides};
}
test('readback of existing Brain record produces seven honest CRO gates, never revenue',()=>{
 const p=projectCroBrainProof([record()],{at});
 assert.equal(p.status,'EVIDENCE_INCOMPLETE');
 assert.equal(p.technicalReadbackVerified,true);
 assert.equal(p.gates.length,7);
 assert.equal(p.gates.filter(x=>x.verified).length,1);
 assert.equal(p.businessOutcomeVerified,false);
 assert.equal(p.verifiedPaidRevenueEur,null);
 assert.equal(p.observed.maturedHoldout,0);
});
test('missing, stale and invalid tenant/writer proof fail closed',()=>{
 assert.equal(projectCroBrainProof([],{at}).status,'NOT_VERIFIED');
 assert.equal(projectCroBrainProof([record({observed_at:'2026-10-29T00:00:00Z'})],{at}).reason,'ONE_BRAIN_READBACK_STALE_OR_FUTURE');
 assert.equal(projectCroBrainProof([record({verified:true})],{at}).reason,'ONE_BRAIN_RECORD_CONTRACT_MISMATCH');
 assert.equal(projectCroBrainProof([record({owner_id:'another-agent'})],{at}).reason,'ONE_BRAIN_RECORD_CONTRACT_MISMATCH');
 assert.equal(projectCroBrainProof([record({payload:{contract:'POWERHOUSE_CRO_COMMERCIAL_CLOSURE_V1',status:'EVIDENCE_INCOMPLETE',gates:g.slice(0,6).map(gate=>({gate,verified:false}))}})],{at}).reason,'GATE_SET_INCOMPLETE');
});
test('full positive flags cannot turn a read-only record into customer revenue claim',()=>{
 const r=record();r.payload.gates=g.map(gate=>({gate,verified:true}));
 const x=projectCroBrainProof([r],{at});
 assert.equal(x.status,'EVIDENCE_INCOMPLETE');
 assert.equal(x.reason,'INDEPENDENT_PROVIDER_AUDIT_REQUIRED');
 assert.equal(x.businessOutcomeVerified,false);
 assert.equal(x.verifiedPaidRevenueEur,null);
});
test('Andere data keeps source readiness distinct from commercial closure; missing Brain becomes partial',()=>{
 const states={daily:'LIVE',experiments:'LIVE',policies:'LIVE',conversionProof:'LIVE',experimentProof:'LIVE',behavior:'LIVE',brainProof:'LIVE'};
 const projected=projectOtherData({at,readStates:states,brainProof:[record()],conversionProof:[{
  event_evidence_status:'PERSISTED_EVENTS_OBSERVED',
  linked_qualified_lead_records_30d:0,
  orders_with_recorded_provider_readback_30d:0
 }]});
 assert.equal(projected.status,'LIVE');
 assert.equal(projected.commercialLoopStatus,'EVIDENCE_INCOMPLETE');
 assert.equal(projected.brainClosure.businessOutcomeVerified,false);
 assert.ok(projected.quality.flags.includes('CRO_COMMERCIAL_CLOSED_LOOP_NOT_PROVEN'));
 const bad=projectOtherData({at,readStates:{...states,brainProof:'UNAVAILABLE'},brainProof:[]});
 assert.equal(bad.status,'PARTIAL');
 assert.ok(bad.quality.flags.includes('ONE_BRAIN_CRO_RUNTIME_READBACK_NOT_VERIFIED'));
});
test('original authenticated Heartbeat, single store and owner-only portal are the only writers/readers',()=>{
 const edge=readFileSync('supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts','utf8');
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const ui=readFileSync('portal-v2/modules/andere-data.js','utf8');
 assert.match(edge,/const croCommercialEvidence=await observeCroCommercialProof\(\)/);
 assert.match(edge,/source:"canonical_brain_records"/);
 assert.match(edge,/on conflict\(tenant_id,idempotency_key\) do update/);
 assert.match(edge,/business_outcome_verified:false/);
 assert.doesNotMatch(edge,/BG211_DELIVERY_ENABLED\s*=\s*true/);
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/&tenant_id=eq.canonical&record_id=like.cro-commercial-evidence:\*/);
 assert.match(ui,/ONE BRAIN · commerciële CRO-terugkoppeling/);
 assert.match(ui,/badge\(brain\?\.technicalReadbackVerified/);
});
