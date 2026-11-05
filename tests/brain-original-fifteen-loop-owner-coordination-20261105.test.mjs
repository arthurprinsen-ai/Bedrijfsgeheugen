import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {summarizeOneLoopAssurance} from '../brain/observability/one-loop-assurance-readback.mjs';
import {projectCroOneLoopAssurance} from '../netlify/functions/powerhouse-cro-other-data.mjs';

const migration=await readFile(new URL('../supabase/migrations/20261105111500_original_15_loop_owner_coordination.sql',import.meta.url),'utf8');
const ui=await readFile(new URL('../portal-v2/modules/powerhouse-observability.js',import.meta.url),'utf8');
const at='2026-11-05T11:15:00Z';
const keys=['autonomous-outreach','content-closed-loop','daily-compound-learning','data-spine-watchdog',
 'execution-resilience','external-intelligence-universe','full-cycle-production-proof','mira-problem-loop',
 'one-brain-reconcile','portal-visual-density','revenue-flywheel','self-improvement-layer',
 'seo-opportunity-resolver','signal-taxonomy-self-heal','source-backed-outbound'];
const makeRows=()=>keys.map((loop_key,i)=>({
 loop_key,status:i===0?'AMBER':i<6?'RED':'GREEN',
 checked_at:at,required_stage_count:8,fresh_stage_count:i===0?6:8,
 missing_stages:i===0?['action','readback']:[],
 evidence:{guard_pass:i<6&&i>0?false:i===0?null:true,
  recovery_owner_registered:true,
  recovery_owner:loop_key==='content-closed-loop'?'powerhouse-content-loop':
   loop_key==='one-brain-reconcile'?'powerhouse-runtime-scheduler-mux-v1 / reconciliation-worker':
   'powerhouse-daily-compound-learning-v1',
  recovery_action:loop_key==='content-closed-loop'?'RECONCILE_ORIGINAL_CHANNEL_PROVIDER_PROOF':
   loop_key==='one-brain-reconcile'?'RESOLVE_ORIGINAL_BRAIN_PROVIDER_OUTCOME':
   'EVALUATE_APPLIED_LEARNING_WITH_REAL_OUTCOMES'}
}));

test('every original active 15-loop source gets exactly one specialist owner and safe handoff, no new queue',()=>{
 for(const key of keys)assert.ok(migration.includes("'"+key+"'"),key);
 assert.match(migration,/ORIGINAL_15_LOOP_POPULATION_CHANGED_FAIL_CLOSED/);
 assert.match(migration,/ORIGINAL_LOOP_RECOVERY_ROUTE_MISSING/);
 assert.match(migration,/r\.evidence_contract->>'recovery_owner'/);
 assert.match(migration,/r\.evidence_contract->>'recovery_action'/);
 assert.match(migration,/'recovery_owner',v_recovery_owner/);
 assert.match(migration,/'recovery_action',case when v_status='GREEN'/);
 assert.match(migration,/owner=excluded\.owner/);
 assert.match(migration,/on conflict \(obligation_type,capability_id,business_entity,business_period,business_timezone\)/);
 assert.match(migration,/case when v_status='GREEN' then 'FULFILLED' else 'OPEN' end/);
 assert.doesNotMatch(migration,/cron\.schedule|cron\.unschedule|create table|drop table|net\.http_post|provider_create/i);
 assert.match(migration,/revoke all on function public\.powerhouse_refresh_loop_assurance_v1\(timestamptz\)\s+from public,anon,authenticated/);
 assert.match(migration,/grant execute on function public\.powerhouse_refresh_loop_assurance_v1\(timestamptz\)\s+to service_role/);
});

test('real canonical registry owner and next action survive original readback and admin CRO projection',()=>{
 const source=summarizeOneLoopAssurance(makeRows(),{observedAt:at});
 assert.equal(source.status,'READBACK_COMPLETE');
 assert.deepEqual(source.counts,{total:15,green:9,amber:1,red:5});
 const content=source.loops.find(x=>x.key==='content-closed-loop');
 assert.equal(content.guard,'FAILED');
 assert.equal(content.recoveryOwner,'powerhouse-content-loop');
 assert.equal(content.recoveryAction,'RECONCILE_ORIGINAL_CHANNEL_PROVIDER_PROOF');
 const brain=source.loops.find(x=>x.key==='one-brain-reconcile');
 assert.equal(brain.recoveryOwner,'powerhouse-runtime-scheduler-mux-v1 / reconciliation-worker');
 const cro=projectCroOneLoopAssurance(source);
 assert.equal(cro.status,'READBACK_COMPLETE');
 assert.equal(cro.loops.find(x=>x.key==='content-closed-loop').recoveryOwner,content.recoveryOwner);
 assert.equal(cro.loops.find(x=>x.key==='one-brain-reconcile').recoveryAction,brain.recoveryAction);
 assert.equal(cro.overallStatus,'RED');
});

test('arbitrary provider payloads, missing proof and forged owner strings cannot enter Portal',()=>{
 const fake=makeRows();
 fake[0].evidence.recovery_owner='attacker<script>alert(1)</script>';
 fake[0].evidence.recovery_action='DELETE_DATA_NOW;DROP TABLE';
 fake[1].evidence.recovery_owner_registered=false;
 const result=summarizeOneLoopAssurance(fake,{observedAt:at});
 assert.equal(result.status,'READBACK_COMPLETE');
 for(const row of result.loops.filter(x=>x.key===fake[0].loop_key||x.key===fake[1].loop_key)){
  assert.equal(row.recoveryOwner,null);
  assert.equal(row.recoveryAction,null);
 }
 assert.doesNotMatch(JSON.stringify(result),/attacker|DELETE_DATA_NOW/);
});

test('original mobile-first portal shows one primary owner action without claiming an outcome',()=>{
 assert.match(ui,/function oneLoopAssuranceView\(assurance\)/);
 assert.match(ui,/data-primary-loop-action/);
 assert.match(ui,/Verantwoordelijk:/);
 assert.match(ui,/row\.recoveryOwner/);
 assert.match(ui,/ORIGINAL_LOOP_REPAIR_LABELS\[row\.recoveryAction\]/);
 assert.match(ui,/esc\(priority\.recoveryOwner\)/);
 assert.match(ui,/details><summary><b>Open alle 15 lussen en oorzaken/);
 assert.doesNotMatch(ui,/function cron\.schedule|new Promise\(.*publish|sendLinkedInMessage/i);
});
