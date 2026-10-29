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

test("CRO canonical learning proposals never claim product release or outcome", async ()=>{
 const {designCroExperiment}=await import("./cro-experiment-cycle.mjs");
 const all=["consent_respected","dismissible","keyboard_accessible","no_blocking_mobile_overlay",
   "no_deceptive_copy","no_sensitive_profiling","one_prompt_per_session","no_duplicate_exposure","rollback_available"];
 const croDesign=designCroExperiment({
  id:"cro:scan:case",tenantId:"bedrijfsgeheugen",pageCanonical:"/zelfscan",
  surface:"scan_followup",hypothesis:"Relevant next step may increase qualified leads",
  falsifier:"No difference in qualified leads",primaryMetric:"qualified_leads",
  sourceEvidenceId:"ga4:verified:20261029",sourceVerified:true,baselineRate:0.02,
  expectedMinimumLift:0.01,ownerAgent:"cro",exposureUnit:"consented-anonymous-session",
  minimumPerArm:100,horizonHours:336,variantIds:["original","contextual"],
  allocationTreatment:0.5,assignmentPersistedBeforeExposure:true,
  existingHeartbeatOwner:"powerhouse-commercial-learning-v1",
  guardrails:Object.fromEntries(all.map(k=>[k,true])),rollbackRef:"git:revert",
  preRegisteredAt:"2026-10-29T12:00:00Z"
 });
 assert.equal(croDesign.state,"PREREGISTERED");
 const signal={id:"cro-event-1",type:"scan_abandonment",observedAt:now,estimatedIncrementalMargin:0,
   confidence:0,dataQuality:0,effortHours:1,risk:0};
 const output=heartbeatGrowthTick({cycleId:"cro-test",
  events:[{provider:"ga4",verified:true,evidenceId:"clicks-measured",signal}],
  experiments:[{id:croDesign.id,croDesign,observed:{}}]},{now});
 assert.equal(output.croOpportunities.length,1);
 assert.equal(output.croLearningProposals.length,1);
 assert.equal(output.experiments[0].status,"MEASUREMENT_REQUIRED");
 assert.equal(output.croLearningProposals[0].writebackVerified,false);
 assert.equal(output.publishReady,false);
 assert.equal(output.revenueVerified,false);
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
