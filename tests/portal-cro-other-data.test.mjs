import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { projectOtherData, projectCroMeasurementCoverage } from '../netlify/functions/powerhouse-cro-other-data.mjs';
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

test('Other data renders independent commercial proof and observed exit behavior in one owner-only screen',()=>{
 const src=readFileSync('portal-v2/modules/andere-data.js','utf8');
 assert.match(src,/Bronbewijs voor leads, orders en experimenten/);
 assert.match(src,/Waar haken bezoekers af/);
 assert.match(src,/badge\(source\.conversionProof\?\.status\)/);
 assert.match(src,/badge\(source\.behavior\?\.status\)/);
});

test('original CRO denominator: 4403 nonrobot flagged page events and 0 CTA are evidence-due, never a proven 0% lead conversion',()=>{
 const row={
  evaluated_at:'2026-10-30T10:33:28.596902Z',
  human_flagged_pageviews_7d:4403,observed_cta_events_7d:0,daily_cta_aggregated_7d:0,
  form_submit_intents_7d:0,recorded_leads_30d:0,
  experiment_assignments_30d:1,matured_treatment_30d:1,matured_holdout_30d:0
 };
 const coverage=projectCroMeasurementCoverage(row);
 assert.equal(coverage.status,'CTA_SIGNAL_UNVERIFIED_WITH_PAGEVIEWS');
 assert.equal(coverage.pageviewsNonRobotFlag7d,4403);
 assert.equal(coverage.ctaEvents7d,0);
 assert.equal(coverage.ctaToPageviewEventRatioPct,null);
 assert.equal(coverage.uniqueHumanVisitorsVerified,false);
 assert.equal(coverage.ctaClickTrackingVerified,false);
 const data=projectOtherData({conversionProof:[{...conversionProof[0],...row}],
   readStates:evidence,experimentProof:[],daily:[{page_views:4403,cta_clicks:0}]});
 assert.equal(data.croMeasurement.status,'CTA_SIGNAL_UNVERIFIED_WITH_PAGEVIEWS');
 assert.equal(data.conversionProof.humanFlaggedPageviews7d,4403);
 assert.equal(data.conversionProof.maturedHoldout30d,0);
 assert.ok(data.quality.flags.includes('CTA_EVENT_GAP_REQUIRES_ORIGINAL_PRODUCER_TO_DATAHUB_READBACK'));
 assert.equal(data.conversionProof.paidOrdersIndependentlyVerified,null);
});

test('original CRO denominator: misaligned event counts must fail closed and no false uplift',()=>{
 const base={evaluated_at:'2026-10-30T10:33:00Z',
   human_flagged_pageviews_7d:100,observed_cta_events_7d:4,
   daily_cta_aggregated_7d:0,form_submit_intents_7d:0};
 const failed=projectCroMeasurementCoverage(base);
 assert.equal(failed.status,'CTA_EVENT_AGGREGATION_MISMATCH');
 assert.equal(failed.ctaClickTrackingVerified,false);
 assert.equal(failed.ctaToPageviewEventRatioPct,4); // descriptive event ratio, not buyers
 const aligned=projectCroMeasurementCoverage({...base,daily_cta_aggregated_7d:4});
 assert.equal(aligned.status,'CTA_EVENTS_OBSERVED_NOT_BUYER_CONVERSION');
 assert.equal(aligned.ctaClickTrackingVerified,true);
 assert.equal(aligned.uniqueHumanVisitorsVerified,false);
 assert.equal(projectCroMeasurementCoverage(null).status,'UNVERIFIED');
 assert.equal(projectCroMeasurementCoverage({human_flagged_pageviews_7d:-2,
   observed_cta_events_7d:0,daily_cta_aggregated_7d:0,form_submit_intents_7d:0}).status,'UNVERIFIED');
});

test('existing admin-only CRO portal gets real 7-day denominator fields from same Supabase view',()=>{
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const ui=readFileSync('portal-v2/modules/andere-data.js','utf8');
 assert.match(api,/select=evaluated_at,human_flagged_pageviews_7d/);
 assert.match(api,/form_submit_intents_7d/);
 assert.match(api,/Powerhouse Growth\/SEO CRO original event producer/); // The existing original owner
 assert.match(ui,/data-original-cro-measurement/);
 assert.match(ui,/geen unieke mensen/);
 assert.match(ui,/Geen.*bezoek.*le(i|e)dt|Meer bezoek leidt niet automatisch tot meer orders/);
 assert.match(ui,/Niet vast te stellen/);
 assert.doesNotMatch(ui,/0% klantconversie bewezen/i);
});
