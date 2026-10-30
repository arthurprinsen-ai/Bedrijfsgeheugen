import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectOtherData,projectCroOneLoopAssurance} from '../netlify/functions/powerhouse-cro-other-data.mjs';
import {ONE_LOOP_ASSURANCE_CONTRACT,summarizeOneLoopAssurance} from '../brain/observability/one-loop-assurance-readback.mjs';
const at='2026-10-30T08:39:00Z';
const names=[
 'daily-compound-learning','data-spine-watchdog','full-cycle-production-proof','portal-visual-density',
 'revenue-flywheel','seo-opportunity-resolver','external-intelligence-universe',
 'execution-resilience','self-improvement-layer','signal-taxonomy-self-heal',
 'source-backed-outbound','autonomous-outreach','content-closed-loop',
 'mira-problem-loop','one-brain-reconcile'];
const reds=new Set(['daily-compound-learning','full-cycle-production-proof','revenue-flywheel','content-closed-loop','one-brain-reconcile']);
const ambers=new Set(['data-spine-watchdog','autonomous-outreach']);
const rows=names.map(key=>({
 loop_key:key,
 status:reds.has(key)?'RED':ambers.has(key)?'AMBER':'GREEN',
 checked_at:'2026-10-30T08:38:00Z',
 fresh_stage_count:ambers.has(key)?7:8,required_stage_count:8,
 missing_stages:key==='data-spine-watchdog'?['decision']:key==='autonomous-outreach'?['action','readback']:[],
 evidence:{guard_pass:reds.has(key)?false:!ambers.has(key)}
}));
test('CRO uses original 15-loop readback without independent scoring, red remains red',()=>{
 const canonical=summarizeOneLoopAssurance(rows,{observedAt:at});
 assert.equal(canonical.contract,ONE_LOOP_ASSURANCE_CONTRACT);
 assert.equal(canonical.status,'READBACK_COMPLETE');
 const same=projectCroOneLoopAssurance(canonical);
 assert.equal(same.status,'READBACK_COMPLETE');
 assert.deepEqual(same.counts,{total:15,green:8,amber:2,red:5});
 assert.equal(same.overallStatus,'RED');
 assert.equal(same.loops.find(r=>r.key==='revenue-flywheel').guard,'FAILED');
 assert.equal(same.loops.find(r=>r.key==='autonomous-outreach').status,'AMBER');
 assert.equal(new Set(same.loops.map(r=>r.key)).size,15);
});
test('partial, stale or contradictory original 15-loop proof never becomes green in CRO',()=>{
 const canonical=summarizeOneLoopAssurance(rows,{observedAt:at});
 const noProof=projectOtherData({oneLoopAssurance:{status:'UNVERIFIED',reason:'CANONICAL_ASSURANCE_NOT_FRESH'},readStates:{}});
 assert.equal(noProof.status,'PARTIAL');
 assert.equal(noProof.oneLoop.status,'UNVERIFIED');
 assert.ok(noProof.quality.flags.includes('ORIGINAL_15_LOOP_ASSURANCE_UNVERIFIED'));
 const oneMissing=projectCroOneLoopAssurance({...canonical,loops:canonical.loops.slice(1)});
 assert.equal(oneMissing.status,'UNVERIFIED');
 const misleading=projectCroOneLoopAssurance({...canonical,counts:{total:15,green:15,amber:0,red:0}});
 assert.equal(misleading.status,'UNVERIFIED');
 const fakeGreen=projectCroOneLoopAssurance({...canonical,
  loops:canonical.loops.map(x=>x.key==='revenue-flywheel'?{...x,status:'GREEN',guard:'FAILED'}:x)});
 assert.equal(fakeGreen.status,'UNVERIFIED');
});
test('original sources are separately represented: API availability is not revenue or 15-loop GREEN',()=>{
 const canonical=summarizeOneLoopAssurance(rows,{observedAt:at});
 const states={daily:'LIVE',experiments:'LIVE',policies:'LIVE',conversionProof:'LIVE',experimentProof:'LIVE',behavior:'LIVE',brainProof:'UNAVAILABLE'};
 const projection=projectOtherData({oneLoopAssurance:canonical,readStates:states,
  conversionProof:[{event_evidence_status:'PERSISTED_EVENTS_OBSERVED',observed_cta_events_7d:0}],
  experimentProof:[]});
 assert.equal(projection.status,'LIVE'); // read-model availability ONLY
 assert.equal(projection.oneLoop.overallStatus,'RED');
 assert.equal(projection.commercialLoopStatus,'NOT_VERIFIED');
 assert.ok(projection.quality.flags.includes('ORIGINAL_15_LOOP_RED_GUARDS_OPEN'));
 assert.equal(projection.conversionProof.paidOrdersIndependentlyVerified,null);
 assert.equal(projection.conversionProof.realizedRevenueIndependentlyVerifiedEur,null);
});
test('only original admin-only Netlify route reads canonical 15-loop view, no new job or store',()=>{
 const api=readFileSync('netlify/functions/powerhouse-cro-other-data.mjs','utf8');
 const portal=readFileSync('portal-v2/modules/andere-data.js','utf8');
 assert.match(api,/isPowerhouseAdmin\(user/);
 assert.match(api,/allowedTenant='canonical'/);
 assert.match(api,/loadOneLoopAssurance\(\{baseUrl:base,key\}\)/);
 assert.match(api,/ORIGINAL_15_LOOP_ASSURANCE_UNVERIFIED/);
 assert.match(portal,/Powerhouse · één canonieke lus \(15 controleketens\)/);
 assert.match(portal,/Growth-event afgeleverd aan ONE BRAIN/);
 assert.doesNotMatch(api,/setInterval|cron\.schedule|CREATE TABLE|CREATE EXTENSION/);
});
