import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 checkMiraProducerPromptCompatibility,buildMiraSourceLockedMotionBrief,
 planMiraPreventiveRecovery,MIRA_PRODUCER_MOTION_COMPATIBILITY_CONTRACT
} from '../supabase/functions/_shared/mira-preventive-quality-recovery.mjs';

const pastPrompts=[
 'LOCK all facial landmarks and pixels in-place during the whole shot. NO facial animation, expression changes, blinking, lip movement. Motion only in an insignificant desk object or distant background detail.',
 'Mira entire face and head are a PHOTOGRAPHICALLY FROZEN PLATE in EVERY frame. No blinking, breathing displacement, eye movement, head or facial gestures. Move only the background.',
 'Keep entire person perfectly still and freeze the face; create an 8 second 9:16 video with motion only in the background.'
];
test('actual categories of prior contradictory paid prompts are blocked BEFORE provider spend',()=>{
 for(const p of pastPrompts){
  const v=checkMiraProducerPromptCompatibility(p);
  assert.equal(v.ok,false,p);
  assert.ok(v.violations.length>0,p);
 }
});
test('new prompt preserves Mira face identity WITHOUT requiring frozen facial pixels',()=>{
 const a=buildMiraSourceLockedMotionBrief({
  runDate:'2026-10-25',masterReferenceId:'Yjqu4D7v76HABNPmQPj1',
  scene:'Mira kijkt in een rustige Nederlandse werkkamer naar haar telefoon met meerdere generieke parkeerapp-icoontjes op een scherm; haar gezicht blijft onveranderd.'
 });
 assert.equal(a.ok,true,JSON.stringify(a));
 assert.equal(a.contract,MIRA_PRODUCER_MOTION_COMPATIBILITY_CONTRACT);
 assert.equal(a.permitted_generation_mode,'image2video');
 assert.equal(a.duration_seconds,8);
 assert.equal(a.native_dimensions,'1080x1920');
 assert.equal(a.official_master_reference_id,'Yjqu4D7v76HABNPmQPj1');
 assert.ok(a.prompt.includes('parkeerapp-icoontjes'));
 assert.match(a.prompt,/natural blinking/i);
 assert.match(a.prompt,/HAND\/finger interaction/i);
 assert.match(a.prompt,/same recognizable adult woman/i);
 assert.equal(checkMiraProducerPromptCompatibility(a.prompt).ok,true);
});
test('no invented source or absent official Mira reference is accepted',()=>{
 assert.equal(buildMiraSourceLockedMotionBrief({scene:'invented scene',runDate:'2026-10-25'}).ok,false);
 assert.equal(buildMiraSourceLockedMotionBrief({scene:' ',runDate:'2026-10-25',masterReferenceId:'X'}).ok,false);
 assert.equal(buildMiraSourceLockedMotionBrief({scene:'scene',runDate:'not-a-date',masterReferenceId:'X'}).ok,false);
});
test('same owner preflight prevention passes compatible clip prompt without granting publish',()=>{
 const frozenId='0a56f150-2954-4355-a3d0-fc65396f8152';
 const root='qAUQW2ZzqdasS0ePb1PD';
 const q=planMiraPreventiveRecovery({
  runDate:'2026-10-25',
  resolved:{kind:'approved_source_led',winner_recommendation_id:frozenId,
   scene:'Mira in approved office with parked car app on her phone',openart_history_id:root},
  job:{status:'WAITING_PROOF',last_error:'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:middle:face=0.860:openart=7lGMacfGJcGL3WGCF4XN',
   asset_manifest:{openart_history_id:root,openart_project_id:'rUF5anXD47gVokckYjf9',recommendation_id:frozenId,openart_reference_id:'Yjqu4D7v76HABNPmQPj1'}},
  ob:{status:'BLOCKED',external_id:null,live_proven_at:null}
 });
 assert.equal(q.eligible,true);
 assert.equal(q.failure_class,'FACE_REFERENCE_OR_FRAMING_DRIFT');
 assert.equal(q.observed_confidence,0.860);
 assert.equal(q.motion_compatible_brief.ok,true);
 assert.equal(q.meta_create_allowed_before_exact_media_pass,false);
 assert.equal(q.bounded_new_generations_per_decision,1);
 assert.equal(q.frozen_winner_recommendation_id,frozenId);
});
test('original channel still enforces quality and provider proof',()=>{
 const code=readFileSync(new URL('../supabase/functions/powerhouse-instagram-media-router/index.ts',import.meta.url),'utf8');
 assert.match(code,/MIRA_OPENART_HISTORY_PREVIOUSLY_REJECTED/);
 assert.match(code,/native_dimensions_verified!==true/);
 assert.match(code,/powerhouse-instagram-temporal-verifier/);
 assert.match(code,/miraFaceProofValid/);
 assert.match(code,/sourceLedAutoVerifyCandidate/);
});
