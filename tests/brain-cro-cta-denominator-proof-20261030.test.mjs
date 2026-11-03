import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectCroMeasurementCoverage,projectOtherData} from '../netlify/functions/powerhouse-cro-other-data.mjs';

// Canonical historical production snapshot. These are 7-day event observations,
// NOT verified unique humans, paid orders, causal uplift or sales conversion.
const snapshot={evaluated_at:'2026-10-30T10:33:28.596902Z',
 human_flagged_pageviews_7d:4403,observed_cta_events_7d:0,
 daily_cta_aggregated_7d:0,form_submit_intents_7d:0,
 experiment_assignments_30d:1,matured_treatment_30d:1,matured_holdout_30d:0};

test('historical replay: 4403/0 keeps original CRO measurement evidence due, never fake buyer conversion',()=>{
 const result=projectCroMeasurementCoverage(snapshot);
 assert.equal(result.status,'CTA_SIGNAL_UNVERIFIED_WITH_PAGEVIEWS');
 assert.equal(result.pageviewsNonRobotFlag7d,4403);
 assert.equal(result.ctaEvents7d,0);
 assert.equal(result.ctaToPageviewEventRatioPct,null);
 assert.equal(result.uniqueHumanVisitorsVerified,false);
 assert.equal(result.ctaClickTrackingVerified,false);
});
test('shadow: original daily CTA mismatch fails while genuine count parity is descriptive only',()=>{
 const bad=projectCroMeasurementCoverage({...snapshot,observed_cta_events_7d:4});
 assert.equal(bad.status,'CTA_EVENT_AGGREGATION_MISMATCH');
 const good=projectCroMeasurementCoverage({...snapshot,observed_cta_events_7d:4,daily_cta_aggregated_7d:4});
 assert.equal(good.status,'CTA_EVENTS_OBSERVED_NOT_BUYER_CONVERSION');
 assert.equal(good.ctaToPageviewEventRatioPct,0.09);
 assert.equal(good.uniqueHumanVisitorsVerified,false);
 assert.equal(projectCroMeasurementCoverage(null).status,'UNVERIFIED');
});
test('canary contract: the original tenant-admin API and portal consume same-source window',()=>{
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const portal=readFileSync('portal-v2/modules/andere-data.js','utf8');
 const skill=readFileSync('.agents/skills/powerhouse-social-cro-funnel/SKILL.md','utf8');
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/select=evaluated_at,human_flagged_pageviews_7d/);
 assert.match(api,/projectCroMeasurementCoverage\(cp\)/);
 assert.match(portal,/data-original-cro-measurement/);
 assert.match(portal,/Niet vast te stellen/);
 assert.match(skill,/CTA_SIGNAL_UNVERIFIED_WITH_PAGEVIEWS/);
 const projection=projectOtherData({conversionProof:[{...snapshot,
  event_evidence_status:'PERSISTED_EVENTS_OBSERVED',
  lead_evidence_status:'NO_LINKED_QUALIFIED_LEAD_PROOF',
  order_evidence_status:'EXTERNAL_PROVIDER_READBACK_REQUIRED_FOR_REVENUE_CLAIM',
  experiment_evidence_status:'CONTROLLED_ASSIGNMENT_AND_MATURED_OUTCOMES_REQUIRED'}],
  readStates:{conversionProof:'LIVE',daily:'LIVE',experiments:'LIVE',policies:'LIVE',experimentProof:'LIVE',behavior:'LIVE'},
  daily:[{page_views:4403,cta_clicks:0}],experimentProof:[]});
 assert.equal(projection.croMeasurement.status,'CTA_SIGNAL_UNVERIFIED_WITH_PAGEVIEWS');
 assert.equal(projection.conversionProof.paidOrdersIndependentlyVerified,null);
 assert.equal(projection.commercialLoopStatus,'NOT_VERIFIED');
 assert.ok(projection.quality.flags.includes('CTA_EVENT_GAP_REQUIRES_ORIGINAL_PRODUCER_TO_DATAHUB_READBACK'));
});
