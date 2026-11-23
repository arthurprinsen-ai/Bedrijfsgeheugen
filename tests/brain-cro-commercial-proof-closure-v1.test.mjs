import test from 'node:test';
import assert from 'node:assert/strict';
import {heartbeatGrowthTick,reconcileCommercialCroProof} from '../tools/growth-intelligence/heartbeat-adapter.mjs';

test('historical replay: delivery-disabled 189878, missing control and zero provider outcomes cannot close CRO loop',()=>{
 const v=heartbeatGrowthTick({cycleId:'2026-10-30:observed',events:[],
  croCommercialProof:{
   cycle_id:'2026-10-30',brain:{delivery_status:'QUEUED',readback_verified:false,last_error:'delivery-disabled'},
   conversion:{event_evidence_status:'PERSISTED_EVENTS_OBSERVED',observed_cta_events_7d:0,
     linked_qualified_lead_records_30d:0,orders_with_recorded_provider_readback_30d:0},
   experiment:{matured_treatment:1,matured_holdout:0,minimum_matured_per_arm:20}
  }});
 assert.equal(v.croCommercialProof.status,'EVIDENCE_INCOMPLETE');
 assert.equal(v.croCommercialProof.gates[0].verified,false);
 assert.equal(v.croCommercialProof.promotionAllowed,false);
 assert.equal(v.croRecoveryProposals[0].noProviderSideEffect,true);
 assert.equal(v.croCommercialProof.writebackProposal.verified,false);
 assert.equal(v.publishReady,false);
 assert.equal(v.revenueVerified,false);
});
test('shadow/canary: nonmatching evidence and buyer/payment flags remain blocked even if aggregates positive',()=>{
 const observed=reconcileCommercialCroProof({
  cycle_id:'production-canary-readonly',
  brain:{delivery_status:'DELIVERED',readback_verified:true,record_id:'brain:readback:1'},
  conversion:{event_evidence_status:'PERSISTED_EVENTS_OBSERVED',
    source_readback_verified:true,event_receipt_id:'growth:event:1',observed_cta_events_7d:10,
    linked_qualified_lead_records_30d:3,orders_with_recorded_provider_readback_30d:1},
  experiment:{matured_treatment:100,matured_holdout:100,minimum_matured_per_arm:20,
    pretreatment_assignment_readback_verified:true,causal_result_verified:true},
  proof:{qualified_buyer_readback_verified:false,payment_provider_readback_verified:false}
 });
 assert.equal(observed.status,'EVIDENCE_INCOMPLETE');
 assert.ok(observed.gates.some(g=>g.gate==='QUALIFIED_BUYER_READBACK'&&!g.verified));
 assert.ok(observed.gates.some(g=>g.gate==='PAID_ORDER_READBACK'&&!g.verified));
 assert.equal(observed.outcomeVerified,false);
 assert.equal(observed.writebackVerified,false);
 assert.equal(observed.promotionAllowed,false);
});
test('all supplied claims require independent audit, never automatic promotion',()=>{
 const v=reconcileCommercialCroProof({cycle_id:'synthetic-contract-test-only',
  brain:{delivery_status:'DELIVERED',readback_verified:true,record_id:'brain:1',
    learning_application_readback_verified:true,applied_learning_id:'learning:1'},
  conversion:{event_evidence_status:'PERSISTED_EVENTS_OBSERVED',
    source_readback_verified:true,event_receipt_id:'event:1',observed_cta_events_7d:10,
    linked_qualified_lead_records_30d:2,orders_with_recorded_provider_readback_30d:2},
  experiment:{matured_treatment:50,matured_holdout:50,minimum_matured_per_arm:50,
    pretreatment_assignment_readback_verified:true,causal_result_verified:true},
  proof:{qualified_buyer_readback_verified:true,qualified_lead_provider_ref:'lead:1',
    payment_provider_readback_verified:true,payment_provider_id:'payment:1',
    same_attribution_lineage_verified:true}});
 assert.equal(v.status,'EVIDENCE_COMPLETE_REQUIRES_INDEPENDENT_AUDIT');
 assert.equal(v.promotionAllowed,false);
 assert.equal(v.writebackVerified,false);
});
