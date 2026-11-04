import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessPreventivePublicationReadiness,PREVENTIVE_PUBLICATION_CONTRACT}
 from '../supabase/functions/_shared/daily-publication-recovery.mjs';

const runDate='2026-11-03',now='2026-11-03T04:00:00Z';
const scheduled_for='2026-11-03T07:00:00Z';
const obligations=[
 {channel:'linkedin_personal',status:'BLOCKED',external_id:null,last_error:'GLOBAL_POST_DUPLICATE_BLOCKED:STORY_FAMILY_DUPLICATE'},
 {channel:'linkedin_company',status:'LIVE_PROVEN',external_id:'urn:li:share:real',live_proven_at:'2026-11-03T03:00:00Z'},
 {channel:'instagram',status:'BLOCKED',external_id:null,last_error:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH'},
 {channel:'blog',status:'GENERATED',external_id:null,approved_at:null}
];
const decisions=[
 {channel:'linkedin_personal',decision:'publish',state:'decided',scheduled_for},
 {channel:'linkedin_company',decision:'publish',state:'published',scheduled_for},
 {channel:'instagram_company',decision:'hold',state:'blocked',scheduled_for,
  delivery_evidence:{capability_state:'BLOCKED_HARD_BOUNDARY'}},
 {channel:'blog',decision:'publish',state:'content_ready',scheduled_for}
];
const mediaJobs=[{channel:'instagram',status:'WAITING_PROOF',last_error:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:start:face=0.900',
 asset_manifest:{openart_history_id:'RejectedOpenArt123'},proof_manifest:{}}];
const assess=(override={})=>assessPreventivePublicationReadiness({
 runDate,now,obligations,decisions,mediaJobs,
 isTerminal:o=>o.status==='LIVE_PROVEN'&&Boolean(o.external_id),
 ...override
});
test('three actual avoidable 3 November blockers are surfaced BEFORE 07:00 while existing company ACK is never replayed',()=>{
 const result=assess();
 assert.equal(result.contract,PREVENTIVE_PUBLICATION_CONTRACT);
 assert.equal(result.status,'PREVENTIVE_ACTION_REQUIRED');
 assert.equal(result.atRisk.length,3);
 assert.deepEqual(result.atRisk.map(x=>[x.channel,x.code]),[
  ['linkedin_personal','DISTINCT_VERIFIED_STORY_REQUIRED'],
  ['instagram','MIRA_FAILED_MEDIA_REPLACEMENT_REQUIRED'],
  ['blog','BLOG_EDITORIAL_APPROVAL_REQUIRED']
 ]);
 assert.ok(result.atRisk.every(x=>x.phase==='BEFORE_DUE'&&x.minutesToDeadline===180));
 assert.equal(result.atRisk.find(x=>x.channel==='blog').requiresAuthorization,true);
 assert.equal(result.atRisk.find(x=>x.channel==='instagram').requiresAuthorization,false);
 assert.ok(result.ready.some(x=>x.channel==='linkedin_company'&&x.proof==='ORIGINAL_TERMINAL_PROVIDER_READBACK'));
 assert.equal(JSON.stringify(result).includes('GLOBAL_POST_DUPLICATE_BLOCKED'),false,'internal errors are not copied into owner-facing risk');
});
test('an unclaimed OpenArt producer is identified BEFORE spending provider credits',()=>{
 const res=assess({obligations:obligations.map(x=>x.channel==='instagram'?{...x,last_error:null,status:'PLANNED'}:x),
 mediaJobs:[{channel:'instagram',status:'WAITING_ASSET',last_error:null,asset_manifest:{},proof_manifest:{}}]});
 assert.equal(res.atRisk.find(x=>x.channel==='instagram').code,'MIRA_PRODUCER_CLAIM_REQUIRED');
 assert.match(res.atRisk.find(x=>x.channel==='instagram').action,/BEFORE paid generation/);
});
test('a job marked PROOF_VERIFIED without independent actual identity PASS is not ready',()=>{
 const res=assess({mediaJobs:[{channel:'instagram',status:'PROOF_VERIFIED',
  proof_manifest:{identity_gate_result:'UNPROVEN',exact_final_media_proven:false}}]});
 assert.equal(res.atRisk.find(x=>x.channel==='instagram').code,'MIRA_FINAL_MEDIA_PROOF_REQUIRED');
});
test('missing decision is actionable, no made-up publication schedule or provider permission',()=>{
 const res=assess({decisions:decisions.filter(x=>x.channel!=='linkedin_personal')});
 const personal=res.atRisk.find(x=>x.channel==='linkedin_personal');
 assert.equal(personal.code,'DECISION_NOT_READY');
 assert.equal(personal.scheduledFor,null);
 assert.equal(personal.nextStep,'ORIGINAL_CHANNEL_OWNER_SELF_REPAIR');
});
test('risk is not manufactured outside the 12h window and inputs fail closed',()=>{
 const future=assess({now:'2026-11-02T00:00:00Z'});
 assert.equal(future.atRisk.length,0);
 assert.equal(future.ready.length,1);
 const unverified=assess({runDate:'not-a-date'});
 assert.equal(unverified.status,'UNVERIFIED');
 assert.equal(unverified.atRisk.length,0);
});
test('existing content-loop owns early readiness with one original producer read, without added sender or schedule',()=>{
 const loop=readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
 const helper=readFileSync('supabase/functions/_shared/daily-publication-recovery.mjs','utf8');
 assert.match(loop,/assessPreventivePublicationReadiness\(\{runDate/);
 assert.match(loop,/\.from\('powerhouse_instagram_media_jobs_v1'\)/);
 assert.match(loop,/name:'original-social-preventive-readiness'/);
 assert.match(loop,/\s+preventive,\s+handoffWriteback/);
 assert.match(helper,/scope:'READ_ONLY_EXISTING_CONTENT_LOOP'/);
 assert.doesNotMatch(helper,/cron\.schedule\(|fetch\(|supabase\.functions\.invoke|publish_to_instagram|update\(\{status:'APPROVED'/);
});

// 4 Nov production: personal LinkedIn had a verified publisher ACK / real URN but
// readback failed Forbidden; this must stay reconciliation-only, not green or resendable.
test('provider ACK without independent personal readback is an explicit preventive risk, not live proof',()=>{
 const res=assess({obligations:obligations.map(o=>o.channel==='linkedin_personal'
   ? {...o,status:'PUBLISHED',external_id:'urn:li:share:real',live_proven_at:null,
      evidence:{provider_publication_ack_verified:true,provider_truth_verified:false}}:o),
   isTerminal:o=>o.status==='LIVE_PROVEN'||o.status==='PUBLISHED'});
 const personal=res.atRisk.find(x=>x.channel==='linkedin_personal');
 assert.equal(personal.code,'INDEPENDENT_PROVIDER_READBACK_REQUIRED');
 assert.equal(personal.nextStep,'ORIGINAL_PROVIDER_RECONCILE_ONLY');
 assert.equal(personal.requiresAuthorization,false);
 assert.equal(res.ready.some(x=>x.channel==='linkedin_personal'),false);
});
test('independently proven personal publication remains ready and never receives recovery risk',()=>{
 const res=assess({obligations:obligations.map(o=>o.channel==='linkedin_personal'
   ? {...o,status:'LIVE_PROVEN',external_id:'urn:li:share:real',
     live_proven_at:'2026-11-04T07:11:00Z',
     evidence:{provider_truth_verified:true}}:o)});
 assert.equal(res.ready.some(x=>x.channel==='linkedin_personal'),true);
 assert.equal(res.atRisk.some(x=>x.channel==='linkedin_personal'),false);
});
test('original loop reads real blog approval and independent live timestamps for preventive risk',()=>{
 const loop=readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
 assert.match(loop,/\.select\('channel,status,external_id,evidence,last_error,next_action,approved_at,live_proven_at,updated_at'\)/);
});

test('source-first preparation executes before original external social delivery without another sender',()=>{
 const loop=readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');
 const source=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
 assert.ok(loop.indexOf("mode:'prepare_only'")>=0);
 assert.ok(loop.indexOf("mode:'prepare_only'")<loop.indexOf("mode:'publish_only'"));
 assert.match(loop,/readinessForChannel\?\.prepared!==true/);
 assert.match(loop,/PREFLIGHT_NOT_READY_NO_SEND/);
 assert.match(source,/const prepareOnly = mode === 'prepare_only'/);
 assert.match(source,/const publishOnly = mode === 'publish_only' \|\| prepareOnly/);
 assert.match(source,/const authority_recovery=prepareOnly\s*\? \{skipped:true,reason:'PREPARE_ONLY_NO_AUTHORITY_MUTATION'\}/);
 assert.match(source,/if\(prepareOnly\)/);
 assert.match(source,/status:'READY_FOR_FINAL_RECHECK'/);
 assert.match(source,/provider_create:false/);
 assert.match(source,/final_review_at_due_required:true/);
 assert.match(source,/if\(dispatchReady.status==='not_due'&&!prepareOnly\)/);
 assert.match(source,/if\(prepareOnly&&dispatchReady.status==='not_due'\)/);
 assert.ok(source.indexOf("status:'ready_for_final_recheck'") < source.indexOf('let instagramMetaConfig:MetaInstagramConfig'));
 assert.doesNotMatch(loop,/cron\.schedule\(/);
});
