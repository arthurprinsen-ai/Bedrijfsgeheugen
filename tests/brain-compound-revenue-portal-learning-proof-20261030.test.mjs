import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectCompoundImprovementProof} from '../netlify/functions/_powerhouse-compound-improvement-proof.mjs';
import {projectOtherData} from '../netlify/functions/powerhouse-cro-other-data.mjs';

const at='2026-10-30T11:26:00Z';
const readiness={observed_at:'2026-10-30T11:25:00Z',open_obligations:501,overdue_obligations:20,
  missing_outcome_evidence:5,missing_economics_evidence:15,missing_feedback_evidence:481,
  overdue_system_obligations:20};
const revenue={measured_at:'2026-10-30T11:25:00Z',open_opportunities:938,executed_actions:483,
  revenue_outcomes:0,due_uncalibrated_forecasts:1867,pending_external_outcomes:5,
  realized_revenue_eur:'0.00'};
const runtime={observed_at:'2026-10-30T11:25:00Z',total_layers:32,wired_layers:32,
  required_jobs:18,active_jobs:18,current_runtime_errors:2,evidence_sparse_required_layers:2,
  architecture_state:'AMBER'};
const states={learningReadiness:'LIVE',revenueFlywheel:'LIVE',runtimeHealth:'LIVE',
  socialApplications:'LIVE',revenueApplications:'LIVE',behavior:'LIVE'};
const snapshot=(extra={})=>({at,learningReadiness:[readiness],revenueFlywheel:[revenue],
  runtimeHealth:[runtime],socialApplications:[],revenueApplications:[],portalBehavior:[],
  readStates:states,...extra});

test('historical revenue/portal/learning replay never invents uplift or paid buyers',()=>{
  const r=projectCompoundImprovementProof(snapshot());
  assert.equal(r.contract,'POWERHOUSE_COMPOUND_IMPROVEMENT_READONLY_V1');
  assert.equal(r.status,'EVIDENCE_DUE');
  assert.deepEqual(r.loops.map(loop=>loop.status),[
    'PAID_OUTCOME_EVIDENCE_DUE','CUSTOMER_VALUE_OUTCOME_EVIDENCE_DUE',
    'REGRESSION_PREVENTION_EFFECT_DUE'
  ]);
  assert.equal(r.loops[0].observed.openOpportunities,938);
  assert.equal(r.loops[0].observed.realizedRevenueEur,0);
  assert.equal(r.loops[0].observed.providerVerifiedPaidAttribution,false);
  assert.equal(r.loops[1].observed.portalRoutePageEvents,0);
  assert.equal(r.loops[1].observed.payingCustomersVerified,false);
  assert.equal(r.loops[2].observed.missingFeedbackEvidence,481);
  assert.equal(r.loops[2].observed.runtimeErrors,2);
  assert.equal(r.guarantees.newScheduledExecutors,0);
  assert.equal(r.guarantees.original15LoopStatusUnchanged,true);
  assert.equal(r.guarantees.recurringDailyGrowthGuaranteed,false);
});

test('shadow: real portal routes give aggregate observations, never paid customer identity or retention',()=>{
 const behavior=[
  {pad:'/portal-v2/overzicht',page_events:12,persisted_event_receipts:9,
   form_starts:3,form_errors:2,form_abandons:1,last_observed_at:'2026-10-30T10:00:00Z'},
  {pad:'/prijzen',page_events:300,persisted_event_receipts:299,
   form_starts:80,form_errors:11,form_abandons:0,last_observed_at:'2026-10-30T10:00:00Z'},
  {pad:'/klantportaal/scans',page_events:4,persisted_event_receipts:4,
   form_starts:1,form_errors:0,form_abandons:0,last_observed_at:'2026-10-30T10:00:00Z'}
 ];
 const r=projectCompoundImprovementProof(snapshot({portalBehavior:behavior}));
 assert.equal(r.evidenceSources.portalActivity.pageEvents,16);
 assert.equal(r.evidenceSources.portalActivity.receiptObservations,13);
 assert.equal(r.evidenceSources.portalActivity.formErrors,2);
 assert.equal(r.evidenceSources.portalActivity.pathsObserved,2);
 assert.equal(r.evidenceSources.portalActivity.payingCustomersVerified,false);
 assert.equal(r.evidenceSources.portalActivity.retentionVerified,false);
 assert.equal(r.loops[1].status,'CUSTOMER_VALUE_OUTCOME_EVIDENCE_DUE');
 assert.equal(JSON.stringify(r).includes('client@example.com'),false);
});

test('next natural social and revenue applications require exact tenant+application identity and effect proof',()=>{
 const apps=[{tenant_id:'canonical',application_id:'social-1',learning_id:'learn-a',
  applied_at:'2026-10-30T10:00:00Z',actual_effect:null,verification_status:'PENDING'}];
 const revenueApps=[{tenant_id:'bedrijfsgeheugen',application_id:'revenue-1',learning_id:'learn-b',
  applied_at:'2026-10-30T09:00:00Z',actual_effect:0.1,verification_status:'TESTING'}];
 const r=projectCompoundImprovementProof(snapshot({socialApplications:apps,revenueApplications:revenueApps}));
 assert.equal(r.evidenceSources.socialApplications.applied7d,1);
 assert.equal(r.evidenceSources.socialApplications.measuredEffects7d,0);
 assert.equal(r.evidenceSources.revenueApplications.measuredEffects7d,1);
 assert.equal(r.evidenceSources.revenueApplications.independentVerifiedEffects7d,0);
 assert.equal(r.loops[0].status,'PAID_OUTCOME_EVIDENCE_DUE');
 const dup=projectCompoundImprovementProof(snapshot({socialApplications:[apps[0],apps[0]]}));
 assert.equal(dup.evidenceSources.socialApplications.reason,'DUPLICATE_APPLICATION_IDENTITY');
 assert.equal(dup.loops[0].status,'UNVERIFIED');
 const wrongTenant=projectCompoundImprovementProof(snapshot({socialApplications:[{...apps[0],tenant_id:'other-customer'}]}));
 assert.equal(wrongTenant.loops[0].status,'UNVERIFIED');
});

test('canary: stale, unavailable, duplicated and invalid original sources fail closed',()=>{
 const stale=projectCompoundImprovementProof(snapshot({learningReadiness:[{...readiness,observed_at:'2026-10-29T01:00:00Z'}]}));
 assert.equal(stale.loops[2].status,'UNVERIFIED');
 const unavailable=projectCompoundImprovementProof(snapshot({readStates:{...states,behavior:'TRUNCATED'}}));
 assert.equal(unavailable.loops[1].status,'UNVERIFIED');
 const invalidMoney=projectCompoundImprovementProof(snapshot({revenueFlywheel:[{...revenue,realized_revenue_eur:null}]}));
 assert.equal(invalidMoney.loops[0].status,'UNVERIFIED');
 const dupRow=projectCompoundImprovementProof(snapshot({runtimeHealth:[runtime,runtime]}));
 assert.equal(dupRow.loops[2].status,'UNVERIFIED');
 const invalidClock=projectCompoundImprovementProof(snapshot({at:'invalid'}));
 assert.equal(invalidClock.status,'UNVERIFIED');
 assert.equal(invalidClock.loops.length,0);
});

test('admin-only original endpoint and one original portal route consume all three loops',()=>{
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const ui=readFileSync('portal-v2/modules/andere-data.js','utf8');
 const projection=readFileSync('netlify/functions/_powerhouse-compound-improvement-proof.mjs','utf8');
 const agents=readFileSync('AGENTS.md','utf8');
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/select\(base,key,'powerhouse_action_learning_readiness_v1'/);
 assert.match(api,/select\(base,key,'powerhouse_revenue_flywheel_v1'/);
 assert.match(api,/select\(base,key,'social_learning_applications'/);
 assert.match(api,/select\(base,key,'revenue_learning_applications'/);
 assert.match(api,/projectCompoundImprovementProof/);
 assert.match(ui,/data-one-brain-compound-proof/);
 assert.match(ui,/Geprioriteerde opdrachten voor bestaande agents/);
 assert.match(agents,/POWERHOUSE_COMPOUND_IMPROVEMENT_READONLY_V1/);
 assert.doesNotMatch(projection,/Netlify\.env|getStore\(|CREATE TABLE|setInterval|cron\.schedule|fetch\(/);
 assert.doesNotMatch(ui,/fetch\('https:\/\/adhjwmvyoixzjtmiroln\.supabase/);
 const old=projectOtherData({at,readStates:{},daily:[],behavior:[]});
 assert.equal(old.compoundImprovement.status,'PARTIAL_SOURCE_READBACK');
 assert.equal(old.commercialLoopStatus,'NOT_VERIFIED');
 assert.ok(old.quality.flags.includes('COMPOUND_IMPROVEMENT_SOURCE_READBACK_INCOMPLETE'));
});
