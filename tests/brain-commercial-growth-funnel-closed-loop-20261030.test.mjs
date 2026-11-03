import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectCommercialGrowthFunnel,COMMERCIAL_FUNNEL_CONTRACT}
 from '../netlify/functions/_powerhouse-commercial-growth-funnel.mjs';
import {projectOtherData} from '../netlify/functions/powerhouse-cro-other-data.mjs';
const at='2026-10-30T12:55:00Z';
const states={growthDaily:'LIVE',emailReplies:'LIVE',conversionProof:'LIVE',
 socialPosts:'LIVE',socialSnapshots:'LIVE',acquisitionEvents:'LIVE',
 learningReadiness:'LIVE',revenueFlywheel:'LIVE',
 socialApplications:'LIVE',revenueApplications:'LIVE'};
const conversionProof={evaluated_at:'2026-10-30T12:54:00Z',
 human_flagged_pageviews_7d:4464,observed_cta_events_7d:0,
 linked_qualified_lead_records_30d:0,orders_with_recorded_provider_readback_30d:0};
const growthDirection={
 website:{metrics:{human_sessions:{direction:'INSUFFICIENT_COMPARABLE_DATA',current:null,previous:null}}},
 email:{sourceState:'LIVE',recordedEvents14d:3}
};
const socialFunnel={status:'COMPARABLE_DESCRIPTIVE_METRICS',channels:[
 {channel:'linkedin_personal',metrics:{views:{direction:'RISING'},likes:{direction:'RISING'},
 comments:{direction:'FLAT'},shares:{direction:'FALLING'},clicks:{direction:'INSUFFICIENT_COMPARABLE_SAMPLE'}}}]};
const compoundImprovement={evidenceSources:{
 revenue:{status:'READBACK_COMPLETE',realizedRevenueEur:0},
 socialApplications:{status:'READBACK_COMPLETE',applied7d:0},
 revenueApplications:{status:'READBACK_COMPLETE',applied7d:0}
}};
const snapshot=(changes={})=>({at,readStates:states,growthDirection,socialFunnel,
 conversionProof,compoundImprovement,acquisitionCta:null,...changes});

test('historical production data: source counts do not become independently paid buyers',()=>{
 const v=projectCommercialGrowthFunnel(snapshot());
 assert.equal(v.contract,COMMERCIAL_FUNNEL_CONTRACT);
 assert.equal(v.status,'SOURCE_OBSERVED_COMMERCIAL_PROOF_INCOMPLETE');
 assert.equal(v.stages.length,8);
 assert.equal(v.observed.pageviewEvents7d,4464);
 assert.equal(v.observed.persistedCtaEvents7d,0);
 assert.equal(v.observed.linkedQualifiedLeads30d,0);
 assert.equal(v.observed.orderProviderReferenceRecords30d,0);
 assert.equal(v.observed.emailReplyEvents14d,3);
 assert.equal(v.observed.naturalLearningApplications7d,0);
 assert.equal(v.observed.registeredRevenueFlywheelEur,0);
 assert.equal(v.observed.verifiedPaidOrders,null);
 assert.equal(v.observed.verifiedRevenueEur,null);
 assert.equal(v.priorities[0].code,'CTA_SOURCE_PRODUCER_TO_PERSISTED_ID');
 assert.equal(v.priorities[0].executionState,'PROPOSED_NOT_EXECUTED');
 assert.equal(v.stages.every(row=>row.independentlyVerified===false),true);
 assert.equal(v.guardrails.guaranteedDailyIncrease,false);
 assert.equal(v.guardrails.original15LoopStatusPreserved,true);
});

test('social provider comparisons are descriptive; never infer attributable visitors or order from likes',()=>{
 const v=projectCommercialGrowthFunnel(snapshot());
 const social=v.stages.find(x=>x.key==='social_reach_engagement');
 const click=v.stages.find(x=>x.key==='social_to_site');
 assert.equal(social.observed[0].views,'RISING');
 assert.equal(social.observed[0].likes,'RISING');
 assert.equal(social.observed[0].reposts,'FALLING');
 assert.equal(social.quality,'PROVIDER_COMPARABLE_48H_DESCRIPTIVE');
 assert.equal(click.observed,null);
 assert.equal(click.quality,'CROSS_CHANNEL_VISITOR_IDENTITY_NOT_VERIFIED');
 assert.equal(v.observed.verifiedPaidOrders,null);
});

test('stale, partial and missing original sources fail closed without a fabricated zero',()=>{
 const missing=projectCommercialGrowthFunnel(snapshot({
  readStates:{...states,conversionProof:'TRUNCATED',emailReplies:'UNAVAILABLE',
   socialSnapshots:'UNAVAILABLE',growthDaily:'UNAVAILABLE'},
  socialFunnel:null,conversionProof:null,compoundImprovement:null
 }));
 assert.equal(missing.status,'PARTIAL_SOURCE_READBACK');
 assert.equal(missing.observed.persistedCtaEvents7d,null);
 assert.equal(missing.observed.pageviewEvents7d,null);
 assert.equal(missing.observed.emailReplyEvents14d,null);
 assert.equal(missing.observed.naturalLearningApplications7d,null);
 assert.equal(missing.observed.verifiedPaidOrders,null);
 const old=projectCommercialGrowthFunnel(snapshot({conversionProof:
  {...conversionProof,evaluated_at:'2026-10-29T00:00:00Z'}}));
 assert.equal(old.observed.persistedCtaEvents7d,null);
 assert.equal(old.stages.find(x=>x.key==='persisted_cta').quality,'UNVERIFIED_OR_STALE');
 const future=projectCommercialGrowthFunnel(snapshot({conversionProof:
  {...conversionProof,evaluated_at:'2026-11-02T00:00:00Z'}}));
 assert.equal(future.status,'PARTIAL_SOURCE_READBACK');
});

test('true event observations and provider reference records remain unverified order evidence',()=>{
 const v=projectCommercialGrowthFunnel(snapshot({conversionProof:{
  ...conversionProof,observed_cta_events_7d:13,linked_qualified_lead_records_30d:2,
  orders_with_recorded_provider_readback_30d:1},
  compoundImprovement:{evidenceSources:{
   revenue:{status:'READBACK_COMPLETE',realizedRevenueEur:400},
   socialApplications:{status:'READBACK_COMPLETE',applied7d:1},
   revenueApplications:{status:'READBACK_COMPLETE',applied7d:0}}}
 }));
 assert.equal(v.observed.persistedCtaEvents7d,13);
 assert.equal(v.observed.orderProviderReferenceRecords30d,1);
 assert.equal(v.observed.verifiedPaidOrders,null);
 assert.equal(v.observed.verifiedRevenueEur,null);
 assert.equal(v.observed.naturalLearningApplications7d,1);
 assert.equal(v.stages.find(x=>x.key==='provider_order').quality,'ORDER_PROVIDER_REFERENCE_NOT_INDEPENDENT_PAYMENT');
 assert.ok(!v.priorities.some(x=>x.code==='CTA_SOURCE_PRODUCER_TO_PERSISTED_ID'));
 assert.equal(v.guardrails.noDuplicatePublisher,true);
});

test('original owner-only route, single portfolio, no side effects or new cron',()=>{
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const ui=readFileSync('portal-v2/modules/andere-data.js','utf8');
 const adapter=readFileSync('netlify/functions/_powerhouse-commercial-growth-funnel.mjs','utf8');
 const docs=readFileSync('AGENTS.md','utf8');
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/projectCommercialGrowthFunnel/);
 assert.match(ui,/data-one-brain-commercial-funnel/);
 assert.match(docs,/POWERHOUSE_ONE_BRAIN_COMMERCIAL_FUNNEL_V1/);
 assert.doesNotMatch(adapter,/fetch\(|cron\.schedule|setInterval|getStore\(|INSERT INTO|api\.send/);
 const x=projectOtherData({at,daily:[],behavior:[],readStates:{}});
 assert.equal(x.commercialGrowthFunnel.status,'PARTIAL_SOURCE_READBACK');
 assert.equal(x.commercialGrowthFunnel.observed.verifiedRevenueEur,null);
});
