import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectOriginalCommercialMomentum} from '../tools/content-growth/original-commercial-momentum.mjs';
import {projectOtherData} from '../netlify/functions/powerhouse-cro-other-data.mjs';

const at='2026-10-30T10:30:00Z';
const day=(day,page_views,cta_clicks=0,canonical='https://www.bedrijfsgeheugen.nl/over-ons')=>
 ({day,canonical,page_views,cta_clicks,qualified_leads:0,won_orders:0,revenue_eur:0});

test('historical evidence: more than 4k recorded pageviews with zero CTA events is an instrumentation anomaly, not 0% proven conversion',()=>{
 const rows=[day('2026-10-25',356),day('2026-10-26',551),day('2026-10-27',1782),
  day('2026-10-28',1111),day('2026-10-29',598),day('2026-10-30',3)];
 const report=projectOriginalCommercialMomentum({daily:rows,readStatus:'LIVE',
  conversionProof:{event_evidence_status:'PERSISTED_EVENTS_OBSERVED',observed_cta_events_7d:0},
  at});
 assert.equal(report.current.pageViews,4398,'Exclude partial current day');
 assert.equal(report.current.ctaClicks,0);
 assert.equal(report.ctaMeasurement.conversionRatePercent,null);
 assert.equal(report.metrics.websitePageViews.direction,'INSUFFICIENT_COMPARABLE_SOURCE');
 assert.ok(report.flags.includes('CTA_ZERO_WITH_TRAFFIC_MEASUREMENT_ANOMALY'));
 assert.ok(report.flags.includes('TOP_PAGE_CONCENTRATION_REVIEW_REQUIRED'));
 assert.equal(report.priority.decision,'VERIFY_CTA_EMISSION_ACK_AND_PERSISTED_SOURCE');
 assert.equal(report.email.verifiedReplies,null);
 assert.equal(report.email.paidOrdersFromEmail,null);
 assert.equal(report.email.paidOrdersFromConnections,null);
 assert.equal(report.orders.verifiedPaidOrders,null);
 assert.equal(report.futureIncreaseGuaranteed,false);
 assert.equal(report.addedScheduler,false);
 assert.equal(report.addedTruthStore,false);
});

test('7d comparison uses full local Amsterdam calendar days, not partly elapsed day',()=>{
 const rows=[];
 for(let d=9;d<=15;d++)rows.push(day('2026-10-'+d,10,1));
 for(let d=23;d<=29;d++)rows.push(day('2026-10-'+d,20,2));
 rows.push(day('2026-10-30',100000,500));
 const r=projectOriginalCommercialMomentum({daily:rows,readStatus:'LIVE',
  conversionProof:{event_evidence_status:'PERSISTED_EVENTS_OBSERVED',observed_cta_events_7d:14},at});
 // The immediately prior 7d are Oct 16-22. Oct 9-15 cannot be substituted.
 assert.equal(r.metrics.websitePageViews.direction,'INSUFFICIENT_COMPARABLE_SOURCE');
 assert.equal(r.current.pageViews,140);
 assert.equal(r.previous.pageViews,0);
 const complete=[...rows,...Array.from({length:7},(_,i)=>day('2026-10-'+(16+i),10,1))];
 const x=projectOriginalCommercialMomentum({daily:complete,readStatus:'LIVE',
  conversionProof:{event_evidence_status:'PERSISTED_EVENTS_OBSERVED',observed_cta_events_7d:14},at});
 assert.equal(x.metrics.websitePageViews.direction,'RISING');
 assert.equal(x.metrics.websitePageViews.changePercent,100);
 assert.equal(x.metrics.ctaClicks.direction,'RISING');
 assert.equal(x.current.ctaClicks,14);
 assert.equal(x.previous.ctaClicks,7);
 assert.equal(x.randomizedExperiment.causalUpliftProven,false);
});

test('unknown paid revenue/replies cannot become zero or claim sales from a provider send',()=>{
 const report=projectOriginalCommercialMomentum({
  daily:[day('2026-10-29',42,2)],readStatus:'LIVE',
  outreachRecovery:{status:'SOURCE_READBACK_COMPLETE',providerVerifiedSends:7},
  at});
 assert.equal(report.email.providerVerifiedSends,7);
 assert.equal(report.email.verifiedReplies,null);
 assert.equal(report.orders.verifiedRevenueEur,null);
 assert.equal(report.orders.verifiedPaidOrders,null);
 assert.equal(report.ctaMeasurement.conversionRatePercent,null);
});

test('original authorized portal exposes only a read-only adapter and retains the existing social, CRO, Brain and provider gate',()=>{
 const rows=[day('2026-10-29',300)];
 const data=projectOtherData({daily:rows,readStates:{daily:'LIVE'},conversionProof:[],at});
 assert.equal(data.growthMomentum.priority.decision,'VERIFY_CTA_EMISSION_ACK_AND_PERSISTED_SOURCE');
 assert.ok(data.quality.flags.includes('CTA_ZERO_WITH_TRAFFIC_MEASUREMENT_ANOMALY'));
 assert.equal(data.growthMomentum.source,'public.growth_page_daily');
 assert.equal(data.oneLoop.status,'UNVERIFIED');
 const ui=readFileSync('portal-v2/modules/andere-data.js','utf8');
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 assert.match(ui,/data-cro-original-momentum/);
 assert.match(ui,/Betaalde orders uit e-mail/);
 assert.match(ui,/Betaalde orders uit connecties/);
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/projectOriginalCommercialMomentum/);
 assert.doesNotMatch(api,/INSERT INTO|UPDATE growth_page_daily|new scheduler/);
});
