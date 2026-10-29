import test from 'node:test';
import assert from 'node:assert/strict';
import { projectOtherData } from '../netlify/functions/powerhouse-cro-other-data.mjs';
import { findPage } from '../portal-v2/page-registry.js';

const evidence={daily:'LIVE',experiments:'LIVE',policies:'LIVE',conversionProof:'LIVE',experimentProof:'LIVE',behavior:'LIVE'};
const conversionProof=[{event_evidence_status:'PERSISTED_EVENTS_OBSERVED',lead_evidence_status:'NO_LINKED_QUALIFIED_LEAD_PROOF',order_evidence_status:'EXTERNAL_PROVIDER_READBACK_REQUIRED_FOR_REVENUE_CLAIM',experiment_evidence_status:'CONTROLLED_ASSIGNMENT_AND_MATURED_OUTCOMES_REQUIRED',observed_cta_events_7d:2,daily_cta_aggregated_7d:2,recorded_leads_30d:0,linked_qualified_lead_records_30d:0,orders_with_recorded_provider_readback_30d:0}];
test('Andere data is a single native portal route',()=>{
  assert.equal(findPage('andere-data')?.label,'Andere data');
  assert.equal(findPage('andere-data')?.sectionId,'data-intelligence');
});
test('CRO data keeps missing evidence distinct from real zeros',()=>{
  const unknown=projectOtherData({readStates:{}});
  assert.equal(unknown.status,'PARTIAL');
  assert.equal(unknown.website,null);
  assert.equal(unknown.experiments,null);
  assert.match(unknown.quality.flags.join(' '),/SOURCE_UNAVAILABLE/);
  const data=projectOtherData({readStates:evidence,conversionProof,experimentProof:[],daily:[
    {page_views:9,cta_clicks:0,qualified_leads:0,won_orders:0,revenue_eur:0,updated_at:'2026-10-29T09:00:00Z'}
  ],experiments:[{
    experiment_id:'test',hypothesis:'CTA improves leads',
    status:'INSUFFICIENT_EVIDENCE',causal_status:'insufficient_evidence',
    treatment_assignments:1,holdout_assignments:0
  }],policies:[{experiment_key:'policy',treatment_pct:50}]});
  assert.equal(data.status,'LIVE');
  assert.equal(data.website.pageViews,9);
  assert.equal(data.website.ctaClicks,0);
  assert.equal(data.experiments.length,1);
  assert.equal(data.experiments[0].eligible,false);
  assert.ok(data.quality.flags.includes('CTA_TRACKING_NOT_VERIFIED'));
  assert.ok(data.quality.flags.includes('EXPERIMENT_EVIDENCE_INCOMPLETE'));
});
test('No invented causal promotion or revenue on missing experiment fields',()=>{
  const data=projectOtherData({readStates:evidence,conversionProof,experimentProof:[],experiments:[{
    experiment_id:'x',status:'ACTIVE',realized_revenue_eur:null,
    hypothesis:'<img src=x onerror=alert(1)>'
  }]});
  assert.equal(data.experiments[0].realizedRevenue,null);
  assert.equal(data.experiments[0].eligible,false);
  assert.equal(data.experiments[0].causalStatus,'');
  assert.equal(data.website.pageViews,0); // no observed rows, not a claim of actual traffic
});

test('CRO portal keeps independent paid-order claim unknown despite positive daily won-order totals',()=>{
 const data=projectOtherData({readStates:evidence,daily:[{page_views:50,cta_clicks:5,won_orders:4,revenue_eur:12000}],experiments:[],policies:[],conversionProof,experimentProof:[]});
 assert.equal(data.status,'LIVE'); // All canonical data sources readable, not a paid-order claim.
 assert.equal(data.website.wonOrders,4);
 assert.equal(data.conversionProof.ordersWithRecordedProviderReadback30d,0);
 assert.equal(data.conversionProof.paidOrdersIndependentlyVerified,null);
 assert.equal(data.conversionProof.realizedRevenueIndependentlyVerifiedEur,null);
 assert.ok(data.quality.flags.includes('INDEPENDENT_PAID_ORDER_VERIFICATION_REQUIRED'));
});

test('CRO portal fails closed before migration has exposed the restricted proof views',()=>{
 const data=projectOtherData({readStates:{daily:'LIVE',experiments:'LIVE',policies:'LIVE',conversionProof:'UNAVAILABLE',experimentProof:'UNAVAILABLE'},daily:[],experiments:[],policies:[]});
 assert.equal(data.status,'PARTIAL');
 assert.equal(data.conversionProof,null);
 assert.equal(data.experimentProof,null);
 assert.ok(data.quality.flags.includes('PERSISTED_CONVERSION_PROOF_SOURCE_UNAVAILABLE'));
});

test('last visible section is an observed exit proxy, never a verified lead',()=>{
 const data=projectOtherData({readStates:evidence,conversionProof,experimentProof:[],behavior:[
  {pad:'/prijzen',last_visible_section:'faq',page_events:0,observed_exits:3,observed_exits_under_25:2,form_abandons:1},
  {pad:'/prijzen',last_visible_section:'_overige_events',page_events:10,observed_exits:0,observed_exits_under_25:0,form_abandons:0},
  {pad:'/contact',last_visible_section:'formulier',page_events:0,observed_exits:1,observed_exits_under_25:0,form_abandons:1}
 ]});
 assert.equal(data.status,'LIVE');
 assert.equal(data.behavior.events.observed_exits,4);
 assert.equal(data.behavior.exitSections.find(x=>x.section==='faq').observedExits,3);
 assert.equal(data.behavior.events.form_abandons,2);
 assert.equal(data.website.wonOrders,0);
});
test('missing behavior projection cannot be green even with healthy experiment sources',()=>{
 const data=projectOtherData({readStates:{daily:'LIVE',experiments:'LIVE',policies:'LIVE',conversionProof:'LIVE',experimentProof:'LIVE',behavior:'UNAVAILABLE'},conversionProof,experimentProof:[]});
 assert.equal(data.status,'PARTIAL');
 assert.equal(data.behavior,null);
 assert.ok(data.quality.flags.includes('BEHAVIOR_EXIT_SOURCE_UNAVAILABLE'));
});

test('Source readback needs persistent event IDs before telemetry trust is established',()=>{
 const absent=projectOtherData({readStates:evidence,conversionProof,experimentProof:[],behavior:[{pad:'/prijzen',page_events:7,persisted_event_receipts:0,historical_without_receipt:7}]});
 assert.equal(absent.behavior.events.persisted_event_receipts,0);
 assert.ok(absent.quality.flags.includes('NEW_EVENT_UID_READBACK_NOT_YET_VERIFIED'));
 const received=projectOtherData({readStates:evidence,conversionProof,experimentProof:[],behavior:[{pad:'/prijzen',page_events:7,persisted_event_receipts:7,historical_without_receipt:0}]});
 assert.equal(received.behavior.events.persisted_event_receipts,7);
 assert.ok(!received.quality.flags.includes('NEW_EVENT_UID_READBACK_NOT_YET_VERIFIED'));
});
