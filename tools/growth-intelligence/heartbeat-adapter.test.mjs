import test from "node:test";
import assert from "node:assert/strict";
import {ingestSignals,heartbeatGrowthTick} from "./heartbeat-adapter.mjs";
import {designCroExperiment} from "./decision-core.mjs";
const now=1750000000000,signal={id:"abc",type:"scan_abandonment",observedAt:now,estimatedIncrementalMargin:2900,confidence:0.6,dataQuality:0.8,effortHours:4,risk:0.1};
test("ingest only independently verified and fresh metrics",()=>{
 const r=ingestSignals([{provider:"ga4",verified:true,evidenceId:"evt1",signal},{provider:"ga4",verified:false,evidenceId:"evt2",signal:{...signal,id:"bad"}}],{now});
 assert.equal(r.accepted.length,1);assert.equal(r.quarantined.length,1);
});
test("heartbeat tick proposes only; does not claim deployment or revenue",()=>{
 const r=heartbeatGrowthTick({cycleId:"day-1",events:[{provider:"ga4",verified:true,evidenceId:"evt1",signal}]},{now});
 assert.equal(r.actions.length,1);assert.equal(r.publishReady,false);assert.equal(r.revenueVerified,false);
});


import {createCustomerSignalCards} from "./heartbeat-adapter.mjs";
test("verified external signals yield scoped advice, not autonomous claims",()=>{
 const now=Date.UTC(2026,9,25);
 const events=[
  {provider:"search_console",verified:true,evidenceId:"provider-proof",signal:{id:"market-1",tenantId:"a",type:"search_opportunity",observedAt:now,relevanceExplanation:"Nieuwe relevante zoekvraag"}},
  {provider:"search_console",verified:true,evidenceId:"provider-proof",signal:{id:"market-2",tenantId:"b",type:"search_opportunity",observedAt:now}},
  {provider:"search_console",verified:false,evidenceId:"unproven",signal:{id:"market-3",tenantId:"a",type:"search_opportunity",observedAt:now}}
 ];
 const r=createCustomerSignalCards(events,{tenantId:"a",now});
 assert.equal(r.cards.length,1);
 assert.equal(r.cards[0].automatedActionAllowed,false);
 assert.equal(r.cards[0].sourceEvidence,"search_console:provider-proof");
 assert.deepEqual(r.rejected.map(x=>x.reason).sort(),["SOURCE_NOT_VERIFIED","TENANT_SCOPE_MISMATCH"]);
});

test("CRO experiment uses existing Heartbeat packet, emits learning candidate without side effects",()=>{
 const guards=Object.fromEntries(["consent_respected","dismissible","keyboard_accessible",
 "no_blocking_mobile_overlay","no_deceptive_copy","no_sensitive_profiling",
 "one_prompt_per_session","no_duplicate_exposure","rollback_available"].map(k=>[k,true]));
 const design=designCroExperiment({
  id:"cro:frisse-blik:replay",tenantId:"bedrijfsgeheugen",pageCanonical:"/frisse-blik",
  surface:"scan_followup",hypothesis:"Contextual followup improves qualified leads",
  falsifier:"Observed lift fails to exceed minimum after matured horizon",
  primaryMetric:"qualified_leads",sourceEvidenceId:"ga4:verified:baseline",sourceVerified:true,
  baselineRate:.04,expectedMinimumLift:.01,ownerAgent:"cro",exposureUnit:"consented-anon-subject",
  minimumPerArm:100,horizonHours:336,variantIds:["control-v1","help-v1"],
  allocationTreatment:.5,assignmentPersistedBeforeExposure:true,
  existingHeartbeatOwner:"powerhouse-commercial-learning-v1",guardrails:guards,
  rollbackRef:"git:bounded-revert",preRegisteredAt:"2026-10-29T12:00:00Z"
 });
 assert.equal(design.state,"PREREGISTERED");
 const observed={
  controlExposures:1000,treatmentExposures:1000,
  controlConversions:40,treatmentConversions:80,
  assignmentEvidenceId:"assignment:readback:001",exposureEvidenceId:"exposure:readback:001",
  primaryOutcomeEvidenceId:"outcome:readback:001",
  assignmentReadbackVerified:true,exposureReadbackVerified:true,
  primaryOutcomeReadbackVerified:true,horizonMatured:true
 };
 const packet=heartbeatGrowthTick({
  cycleId:"cro:existing:heartbeat",
  events:[{provider:"ga4",verified:true,evidenceId:"ga4:page-exit:001",signal}],
  experiments:[{id:design.id,croDesign:design,observed}]
 },{now});
 assert.equal(packet.croOpportunities.length,1);
 assert.equal(packet.experiments.length,1);
 assert.equal(packet.experiments[0].status,"CANDIDATE_WIN");
 assert.equal(packet.croLearningProposals.length,1);
 assert.equal(packet.croLearningProposals[0].productionVerified,false);
 assert.equal(packet.croLearningProposals[0].writebackVerified,false);
 assert.equal(packet.publishReady,false);
 assert.equal(packet.revenueVerified,false);
});
test("missing CRO verification never generates a winner or revenue",()=>{
 const guards=Object.fromEntries(["consent_respected","dismissible","keyboard_accessible",
 "no_blocking_mobile_overlay","no_deceptive_copy","no_sensitive_profiling",
 "one_prompt_per_session","no_duplicate_exposure","rollback_available"].map(k=>[k,true]));
 const design=designCroExperiment({
  id:"cro:unverified:replay",tenantId:"bedrijfsgeheugen",pageCanonical:"/afas",
  surface:"whatsapp_prompt",hypothesis:"WhatsApp contextual help increases qualified leads",
  falsifier:"No qualified lead uplift",primaryMetric:"qualified_leads",
  sourceEvidenceId:"ga4:baseline:verified",sourceVerified:true,baselineRate:.04,
  expectedMinimumLift:.01,ownerAgent:"cro",exposureUnit:"anonymous",
  minimumPerArm:100,horizonHours:336,variantIds:["control-v1","whatsapp-v1"],
  allocationTreatment:.5,assignmentPersistedBeforeExposure:true,
  existingHeartbeatOwner:"powerhouse-commercial-learning-v1",guardrails:guards,
  rollbackRef:"git:bounded-revert",preRegisteredAt:"2026-10-29T12:00:00Z"
 });
 const packet=heartbeatGrowthTick({cycleId:"cro-unverified",events:[],
   experiments:[{id:design.id,croDesign:design,observed:{}}]},{now});
 assert.equal(packet.experiments[0].status,"MEASUREMENT_REQUIRED");
 assert.equal(packet.croLearningProposals[0].status,"MEASUREMENT_REQUIRED");
 assert.equal(packet.croLearningProposals[0].productionVerified,false);
 assert.equal(packet.publishReady,false);
 assert.equal(packet.revenueVerified,false);
});

test("Heartbeat emits analytics reconciliation candidate without inventing an experiment win",()=>{
 const snapshot={windowStart:'2026-10-22',windowEnd:'2026-10-29',
  pageDailyWindowStart:'2026-10-22',pageDailyWindowEnd:'2026-10-29',
  interactionsWindowStart:'2026-10-22',interactionsWindowEnd:'2026-10-29',
  pageViews:3634,ctaClicks:0,nonBotInteractions:1201,clickLikeEvents:48,
  pageDailyVerified:true,interactionsVerified:true,
  pageDailyEvidenceRef:'supabase:growth_page_daily:20261029',
  interactionsEvidenceRef:'supabase:bg_interacties:20261029'};
 const packet=heartbeatGrowthTick({cycleId:'growth:cro:data-audit',events:[],croMeasurementSnapshots:[snapshot]},{now});
 assert.equal(packet.croDataGaps[0].status,'RECONCILIATION_REQUIRED');
 assert.equal(packet.experiments.length,0);
 assert.equal(packet.croDataGaps[0].writebackVerified,false);
 assert.equal(packet.publishReady,false);
 assert.equal(packet.revenueVerified,false);
});

test("commercial CRO cannot promote historical delivery-disabled queue or a single treatment",()=>{
 const packet=heartbeatGrowthTick({cycleId:'cro:real-prod-observation',events:[],
  croCommercialProof:{cycle_id:'2026-10-30',conversion:{
   event_evidence_status:'PERSISTED_EVENTS_OBSERVED',
   observed_cta_events_7d:0,linked_qualified_lead_records_30d:0,
   orders_with_recorded_provider_readback_30d:0},
   experiment:{matured_treatment:1,matured_holdout:0,minimum_matured_per_arm:20},
   brain:{delivery_status:'QUEUED',last_error:'delivery-disabled',readback_verified:false}}
 },{now});
 assert.equal(packet.croCommercialProof.status,'EVIDENCE_INCOMPLETE');
 assert.equal(packet.croCommercialProof.gates[0].gate,'BRAIN_DELIVERY_READBACK');
 assert.equal(packet.croCommercialProof.gates[0].verified,false);
 assert.equal(packet.croCommercialProof.nextAction,'RECONCILE_EXISTING_BRAIN_DELIVERY_WITHOUT_BG211_REPLAY');
 assert.equal(packet.croCommercialProof.promotionAllowed,false);
 assert.equal(packet.croRecoveryProposals[0].noProviderSideEffect,true);
 assert.equal(packet.croRecoveryProposals[0].brainWritebackVerified,false);
 assert.equal(packet.revenueVerified,false);
});
test("missing CRO readback stays unassessed rather than falsely green",()=>{
 const packet=heartbeatGrowthTick({cycleId:'cro:no-snapshot',events:[]},{now});
 assert.equal(packet.croCommercialProof.status,'NOT_ASSESSED');
 assert.deepEqual(packet.croRecoveryProposals,[]);
 assert.equal(packet.publishReady,false);
});
test("aggregate count alone cannot turn into independently verified lead or order",()=>{
 const {reconcileCommercialCroProof}=await import('./heartbeat-adapter.mjs');
 const r=reconcileCommercialCroProof({cycle_id:'2026-10-30',conversion:{
   event_evidence_status:'PERSISTED_EVENTS_OBSERVED',
   source_readback_verified:true,event_receipt_id:'event:persisted:001',
   observed_cta_events_7d:12,linked_qualified_lead_records_30d:5,
   orders_with_recorded_provider_readback_30d:2},
   experiment:{matured_treatment:100,matured_holdout:100,minimum_matured_per_arm:20,
     pretreatment_assignment_readback_verified:true,causal_result_verified:true},
   brain:{delivery_status:'DELIVERED',readback_verified:true,record_id:'brain:read:001',
     learning_application_readback_verified:false},
   proof:{qualified_buyer_readback_verified:false,payment_provider_readback_verified:false}});
 assert.equal(r.status,'EVIDENCE_INCOMPLETE');
 assert.ok(r.gates.some(g=>g.gate==='QUALIFIED_BUYER_READBACK'&&!g.verified));
 assert.ok(r.gates.some(g=>g.gate==='PAID_ORDER_READBACK'&&!g.verified));
 assert.equal(r.outcomeVerified,false);
 assert.equal(r.writebackProposal.verified,false);
});
test("even fully attested CRO proof only permits independent audit, not automatic promotion",()=>{
 const {reconcileCommercialCroProof}=await import('./heartbeat-adapter.mjs');
 const r=reconcileCommercialCroProof({cycle_id:'verified-replay',conversion:{
   event_evidence_status:'PERSISTED_EVENTS_OBSERVED',
   source_readback_verified:true,event_receipt_id:'event:persisted:001',
   observed_cta_events_7d:12,linked_qualified_lead_records_30d:5,
   orders_with_recorded_provider_readback_30d:2},
   experiment:{matured_treatment:100,matured_holdout:100,minimum_matured_per_arm:20,
     pretreatment_assignment_readback_verified:true,causal_result_verified:true},
   brain:{delivery_status:'DELIVERED',readback_verified:true,record_id:'brain:read:001',
     learning_application_readback_verified:true,applied_learning_id:'learning:readback:001'},
   proof:{qualified_buyer_readback_verified:true,qualified_lead_provider_ref:'lead:readback:001',
     payment_provider_readback_verified:true,payment_provider_id:'payment:readback:001',
     same_attribution_lineage_verified:true}});
 assert.equal(r.status,'EVIDENCE_COMPLETE_REQUIRES_INDEPENDENT_AUDIT');
 assert.equal(r.gates.filter(g=>!g.verified).length,0);
 assert.equal(r.promotionAllowed,false);
 assert.equal(r.writebackVerified,false);
});
