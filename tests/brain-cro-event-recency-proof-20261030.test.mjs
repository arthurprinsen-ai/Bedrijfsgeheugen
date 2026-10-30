import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectCroEventRecency,projectOtherData} from '../netlify/functions/powerhouse-cro-other-data.mjs';

const now='2026-10-30T11:00:00Z';
const view={evaluated_at:'2026-10-30T10:59:00Z',
  last_persisted_event_at:'2026-10-30T02:20:34.179Z',
  human_flagged_pageviews_7d:4410,observed_cta_events_7d:0,
  daily_cta_aggregated_7d:0,form_submit_intents_7d:0,
  event_evidence_status:'PERSISTED_EVENTS_OBSERVED',
  lead_evidence_status:'NO_LINKED_QUALIFIED_LEAD_PROOF',
  order_evidence_status:'EXTERNAL_PROVIDER_READBACK_REQUIRED_FOR_REVENUE_CLAIM'};

test('historical replay detects lack of RECENT source occurrence without claiming pipeline failure',()=>{
 const r=projectCroEventRecency(view,{at:now});
 assert.equal(r.status,'NO_RECENT_EVENT_EVIDENCE');
 assert.equal(r.eventAgeHours,8.66);
 assert.equal(r.lastEventOccurredAt,'2026-10-30T02:20:34.179Z');
 assert.equal(r.sourceAgeMinutes,1);
 assert.equal(r.persistedIdReadbackVerified,false);
 assert.equal(r.deliveryPathHealthyVerified,false);
 assert.equal(r.businessOutcomeVerified,false);
 assert.match(r.interpretation,/not evidence of zero human traffic/);
});

test('shadow: new real source event only proves an observed occurrence, not order or downstream provider',()=>{
 const r=projectCroEventRecency({...view,last_persisted_event_at:'2026-10-30T10:58:00Z'},{at:now});
 assert.equal(r.status,'RECENT_STORED_EVENT_OBSERVED');
 assert.equal(r.eventAgeHours,0.03);
 assert.equal(r.businessOutcomeVerified,false);
 assert.equal(r.persistedIdReadbackVerified,false);
});

test('canary: 24h gap, absent event, stale view, future and malformed times fail closed',()=>{
 assert.equal(projectCroEventRecency({...view,last_persisted_event_at:'2026-10-28T10:00:00Z'},{at:now}).status,'EVENT_RECENCY_EVIDENCE_DUE');
 assert.equal(projectCroEventRecency({...view,last_persisted_event_at:null},{at:now}).status,'NO_EVENT_TIME_RECORDED');
 assert.equal(projectCroEventRecency({...view,evaluated_at:'2026-10-30T09:00:00Z'},{at:now}).reason,'ORIGINAL_VIEW_STALE');
 assert.equal(projectCroEventRecency({...view,last_persisted_event_at:'2026-10-31T08:00:00Z'},{at:now}).status,'UNVERIFIED');
 assert.equal(projectCroEventRecency({...view,last_persisted_event_at:'not a timestamp'},{at:now}).status,'UNVERIFIED');
 assert.equal(projectCroEventRecency(view,{at:'not a timestamp'}).status,'UNVERIFIED');
 assert.equal(projectCroEventRecency(null,{at:now}).status,'UNVERIFIED');
});

test('source projection preserves current original guard status and adds only an evidence flag',()=>{
 const r=projectOtherData({at:now,conversionProof:[view],readStates:{
  daily:'LIVE',experiments:'LIVE',policies:'LIVE',conversionProof:'LIVE',
  experimentProof:'LIVE',behavior:'LIVE'},daily:[],experiments:[],
  experimentProof:[],behavior:[],policies:[]});
 assert.equal(r.croEventRecency.status,'NO_RECENT_EVENT_EVIDENCE');
 assert.ok(r.quality.flags.includes('CRO_EVENT_SOURCE_RECENCY_OR_READBACK_UNVERIFIED'));
 assert.equal(r.commercialLoopStatus,'NOT_VERIFIED');
 assert.equal(r.conversionProof.paidOrdersIndependentlyVerified,null);
});

test('existing admin endpoint and portal surface original view and no second scheduler/store',()=>{
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const ui=readFileSync('portal-v2/modules/andere-data.js','utf8');
 const skill=readFileSync('.agents/skills/powerhouse-social-cro-funnel/SKILL.md','utf8');
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/last_persisted_event_at/);
 assert.match(api,/croEventRecency/);
 assert.match(ui,/data-cro-ingest-freshness/);
 assert.match(ui,/Geen recent opgeslagen event betekent niet/);
 assert.match(skill,/NO_RECENT_EVENT_EVIDENCE/);
 assert.doesNotMatch(api,/cron\.schedule|CREATE TABLE|setInterval/);
});
