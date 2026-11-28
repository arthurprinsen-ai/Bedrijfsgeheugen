import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planMiraExactVideoVerificationResume,MIRA_EXACT_VERIFICATION_RESUME} from '../supabase/functions/powerhouse-instagram-media-router/exact-video-verification-resume.mjs';
import {MIRA_MASTER_REFERENCE_ID,MIRA_MASTER_REFERENCE_URL} from '../supabase/functions/_shared/mira-canonical-face.mjs';

const date='2026-11-18',winner='ab10709a-bad8-4ad4-9305-1b7c0cc83c44';
const history='r6sZX8kdGyvpD6zEbWg7';
const url='https://cdn.openart.ai/openart-ai/production/2026-11/create-video/sample_0_1794981483085_e751afa3.mp4';
const manifest={
  completed_at:'2026-11-18T06:04:15Z',
  daily_winner_recommendation_id:winner,source_recommendation_id:winner,
  openart_history_id:history,openart_project_id:'rUF5anXD47gVokckYjf9',
  asset_url:url,identity_reference_id:MIRA_MASTER_REFERENCE_ID,
  generation_mode:'element2video'
};
const job={id:'original-mira-job',tenant_id:'canonical',publication_date:date,channel:'instagram',
 post_type:'reel',required_provider:'openart',selected_provider:'openart',allowed_providers:['openart'],
 republish_forbidden:false,status:'VERIFYING',attempts:1,last_error:null,
 asset_manifest:manifest,proof_manifest:{}};
const ob={tenant_id:'canonical',publication_date:date,channel:'instagram',status:'BLOCKED',
 external_id:null,live_proven_at:null,evidence:{veto:{active:false}}};
const resolved={kind:'approved_frozen_library_mapping',problem:{id:'PH-P010',
 scene:'Mira bekijkt een werkoverzicht en ziet een signaal dat aandacht vraagt: DSO stijgt. Ze zoekt wie het oppakt.'},
 winner_recommendation_id:winner};
const assess=(overrides={})=>planMiraExactVideoVerificationResume({
 runDate:date,localDate:date,job,ob,resolved,readyProviders:['openart'],
 now:Date.parse('2026-11-18T06:40:00Z'),...overrides
});

test('only one original real video is offered for bounded original vision after cooldown',()=>{
 const p=assess();
 assert.equal(p.kind,'RETRY_EXACT_MEDIA');
 assert.equal(p.attempts,1);
 assert.equal(p.history_id,history);
 assert.equal(p.job_id,job.id);
 assert.equal(p.asset_manifest.asset_url,url);
 assert.equal(p.asset_manifest.openart_history_id,history);
 assert.equal(p.asset_manifest.openart_reference_id,MIRA_MASTER_REFERENCE_ID);
 assert.equal(p.asset_manifest.openart_reference_url,MIRA_MASTER_REFERENCE_URL);
 assert.equal(p.asset_manifest.canonical_problem_id,'PH-P010');
 assert.equal(p.asset_manifest.scene,resolved.problem.scene);
 assert.equal(p.asset_manifest.daily_winner_recommendation_id,winner);
 assert.equal(p.asset_manifest.duration,8);
 assert.ok(Date.parse(p.retry_after)>Date.parse('2026-11-18T06:40:00Z'));
 assert.deepEqual(Object.keys(p.asset_manifest).filter(k=>/new_video|generate|provider_post_id|identity_pass/.test(k)),[]);
});

test('30 minute first cooldown is honored, no hot-loop on transient provider errors',()=>{
 assert.deepEqual(assess({now:Date.parse('2026-11-18T06:20:00Z')}).kind,'HOLD');
 assert.equal(assess({now:Date.parse('2026-11-18T06:20:00Z')}).reason,'COOLDOWN');
 assert.equal(assess({now:Date.parse('2026-11-18T06:35:00Z')}).kind,'RETRY_EXACT_MEDIA');
});

test('lease remains resumable after worker crash, but never before retry deadline',()=>{
 const waiting={...job,status:'WAITING_PROOF',asset_manifest:{...manifest,
  vision_resume_contract:MIRA_EXACT_VERIFICATION_RESUME,vision_retry_count:1,
  vision_retry_after:'2026-11-18T07:10:00Z'}};
 assert.equal(assess({job:waiting,now:Date.parse('2026-11-18T07:00:00Z')}).kind,'HOLD');
 const recovered=assess({job:waiting,now:Date.parse('2026-11-18T07:11:00Z')});
 assert.equal(recovered.kind,'RETRY_EXACT_MEDIA');
 assert.equal(recovered.attempts,2);
 assert.equal(recovered.history_id,history);
 assert.equal(recovered.retry_after,'2026-11-18T08:11:00.000Z');
});

test('same history bounded retries stop at three without regenerate or false green',()=>{
 const waiting={...job,status:'WAITING_PROOF',last_error:'MIRA_FRAME_VISION_PROVIDER_UNAVAILABLE',
  asset_manifest:{...manifest,vision_resume_contract:MIRA_EXACT_VERIFICATION_RESUME,
   vision_retry_count:2,vision_retry_after:'2026-11-18T06:30:00Z'}};
 assert.equal(assess({job:waiting}).kind,'RETRY_EXACT_MEDIA');
 assert.equal(assess({job:{...waiting,asset_manifest:{...waiting.asset_manifest,vision_retry_count:3}}}).kind,'EXHAUSTED');
});

test('reject silently replaced videos, wrong frozen source, wrong master or provider',()=>{
 for(const update of [
  {job:{...job,asset_manifest:{...manifest,openart_history_id:'bad'}}},
  {job:{...job,asset_manifest:{...manifest,asset_url:'https://not-openart.example/video.mp4'}}},
  {job:{...job,asset_manifest:{...manifest,daily_winner_recommendation_id:'other'}}},
  {job:{...job,asset_manifest:{...manifest,identity_reference_id:'other'}}},
  {job:{...job,asset_manifest:{...manifest,openart_project_id:'other'}}},
  {job:{...job,asset_manifest:{...manifest,generation_mode:'text2video'}}},
  {job:{...job,republish_forbidden:true}},
  {job:{...job,attempts:2}},
  {ob:{...ob,external_id:'meta-sent'}},
  {ob:{...ob,evidence:{veto:{active:true}}}},
  {ob:{...ob,status:'LIVE_PROVEN'}},
  {job:{...job,proof_manifest:{exact_final_media_proven:true}}},
  {resolved:{...resolved,winner_recommendation_id:'other'}},
  {runDate:'2026-11-17'},
  {localDate:'2026-11-19'}
 ])assert.equal(assess(update).kind,'NOT_APPLICABLE',JSON.stringify(update));
});

test('hold real measured face rejection instead of automatic retry or video regeneration',()=>{
 const rejected={...job,status:'WAITING_PROOF',last_error:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:start:face=0.91'};
 assert.equal(assess({job:rejected}).kind,'HOLD');
 assert.equal(assess({job:{...job,status:'WAITING_PROOF',last_error:null}}).kind,'HOLD');
 assert.equal(assess({readyProviders:[]}).kind,'HOLD');
});

test('original single-authority router performs CAS before existing async verification',()=>{
 const src=readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 const begin=src.indexOf('const plan=planMiraExactVideoVerificationResume(');
 assert.ok(begin>0);
 const body=src.slice(begin,src.indexOf(" // Heartbeat's existing preflight",begin));
 assert.match(body,/\.eq\('updated_at',job\.updated_at\)/);
 assert.match(body,/\.eq\('attempts',job\.attempts\)/);
 assert.match(body,/status:'WAITING_PROOF'/);
 assert.match(body,/EdgeRuntime\.waitUntil\(background\)/);
 assert.match(body,/action:'submit_asset'/);
 assert.match(body,/assetManifest:plan\.asset_manifest/);
 assert.match(body,/MIRA_EXACT_VIDEO_PROOF_NEEDS_REVIEW/);
 assert.doesNotMatch(body,/openart_generate_video|create_post|instagram_media_publish|new_media_job/);
});

test('original visual identity and final Meta publisher gates remain unchanged',()=>{
 const face=readFileSync('supabase/functions/_shared/mira-canonical-face.mjs','utf8');
 const router=readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
 assert.match(face,/MIRA_IDENTITY_MIN_CONFIDENCE=0\.94/);
 assert.match(router,/miraFaceProofValid\(proof\.instagram_visual\|\|\{},postType\)/);
 assert.match(router,/MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED/);
 assert.match(router,/MIRA_FACE_DRIFT_ACROSS_REEL_FRAMES/);
});

test('owner-approved single extra verification: bound to job+history, same video, never more than four',()=>{
 const review={approved_by:'arthur',approved_at:'2026-11-18T21:55:00Z',extra_attempts:1,
  job_id:job.id,history_id:history,approval_ref:'chat:arthur-20261118-2155',no_regeneration:true};
 const exhausted={...job,status:'WAITING_PROOF',last_error:'MIRA_FRAME_VISION_PROVIDER_UNAVAILABLE',
  asset_manifest:{...manifest,vision_resume_contract:MIRA_EXACT_VERIFICATION_RESUME,
   vision_retry_count:3,vision_retry_after:'2026-11-18T10:18:58Z'}};
 const failedOb={...ob,status:'FAILED'};
 // without owner review: exhausted, and a FAILED obligation is not eligible
 assert.equal(assess({job:exhausted}).kind,'EXHAUSTED');
 assert.equal(assess({job:exhausted,ob:failedOb}).kind,'NOT_APPLICABLE');
 // with review: exactly one more attempt on the same history, no new video
 const approved={...exhausted,asset_manifest:{...exhausted.asset_manifest,owner_review_extra_verification:review}};
 const p=assess({job:approved,ob:failedOb,now:Date.parse('2026-11-18T21:56:00Z')});
 assert.equal(p.kind,'RETRY_EXACT_MEDIA');
 assert.equal(p.attempts,4);
 assert.equal(p.history_id,history);
 // fourth attempt used -> exhausted again, review is not renewable
 const used4={...approved,asset_manifest:{...approved.asset_manifest,vision_retry_count:4}};
 assert.equal(assess({job:used4,ob:failedOb}).kind,'EXHAUSTED');
 // review bound to other job/history, wrong approver or regeneration allowed -> ignored
 for(const bad of [{job_id:'other'},{history_id:'other'},{approved_by:'agent'},{extra_attempts:2},{no_regeneration:false},{approval_ref:''}]){
  const j={...exhausted,asset_manifest:{...exhausted.asset_manifest,owner_review_extra_verification:{...review,...bad}}};
  assert.equal(assess({job:j,ob:failedOb}).kind,'NOT_APPLICABLE',JSON.stringify(bad));
  assert.equal(assess({job:j}).kind,'EXHAUSTED',JSON.stringify(bad));
 }
});
