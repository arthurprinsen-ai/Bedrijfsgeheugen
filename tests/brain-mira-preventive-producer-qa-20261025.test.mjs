import test from 'node:test';
import assert from 'node:assert/strict';
import {planMiraPreventiveRecovery as plan,MIRA_PREVENTIVE_RECOVERY_CONTRACT} from '../supabase/functions/_shared/mira-preventive-quality-recovery.mjs';

const resolved={kind:'approved_source_led',winner_recommendation_id:'0a56f150-2954-4355-a3d0-fc65396f8152',scene:'Mira in a Dutch office checking parking apps',openart_history_id:'qAUQW2ZzqdasS0ePb1PD'};
const job={status:'WAITING_PROOF',republish_forbidden:false,asset_manifest:{openart_project_id:'rUF5anXD47gVokckYjf9',openart_history_id:'qAUQW2ZzqdasS0ePb1PD',openart_reference_id:'Yjqu4D7v76HABNPmQPj1',recommendation_id:resolved.winner_recommendation_id}};
const ob={status:'BLOCKED',external_id:null,live_proven_at:null,evidence:{}};
const args=(error)=>({runDate:'2026-10-25',resolved,job:{...job,last_error:error},ob});

test('real 0.920 face failure produces preventative ORIGINAL producer task, never a PASS',()=>{
 const r=plan(args('VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:start:face=0.920:openart=oGeS7GbhttgNCxnq0tCg'));
 assert.equal(r.eligible,true);
 assert.equal(r.contract,MIRA_PREVENTIVE_RECOVERY_CONTRACT);
 assert.equal(r.failure_class,'FACE_REFERENCE_OR_FRAMING_DRIFT');
 assert.equal(r.rejected_history_id,'oGeS7GbhttgNCxnq0tCg');
 assert.equal(r.observed_confidence,0.92);
 assert.equal(r.required_face_confidence,0.94);
 assert.equal(r.meta_create_allowed_before_exact_media_pass,false);
 assert.match(r.producer_instructions,/black bars/);
 assert.match(r.producer_instructions,/literal start\/end/);
 assert.equal(r.bounded_new_generations_per_decision,1);
});
test('real 0.890 motion failure produces actual motion instructions without loosening the gate',()=>{
 const r=plan(args('MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED:confidence=0.890:openart=a6sdR46HDe58uRlardNl'));
 assert.equal(r.eligible,true);
 assert.equal(r.failure_class,'TEMPORAL_HUMAN_MOTION_INSUFFICIENT');
 assert.equal(r.rejected_history_id,'a6sdR46HDe58uRlardNl');
 assert.equal(r.required_temporal_confidence,0.90);
 assert.match(r.producer_instructions,/human head, hand, blink/);
 assert.equal(r.never_lower_thresholds,true);
});
test('no authorized recovery for wrong source, absent evidence, provider-created or republish forbidden',()=>{
 assert.equal(plan({...args('not-an-independent-quality-failure')}).eligible,false);
 assert.equal(plan({...args('VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:start:face=0.920:openart=q'),resolved:{...resolved,winner_recommendation_id:'wrong'}}).eligible,false);
 assert.equal(plan({...args('MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED:confidence=0.890:openart=q'),ob:{...ob,external_id:'179000000'}}).eligible,false);
 assert.equal(plan({...args('MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED:confidence=0.890:openart=q'),job:{...job,republish_forbidden:true,last_error:'MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED:confidence=0.890:openart=q'}}).eligible,false);
 assert.equal(plan({...args('MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED:confidence=0.890:openart=q'),resolved:{...resolved,kind:'pre_freeze_legacy'}}).eligible,false);
});
test('one immutable winner stays fixed, no fallback masquerades as a Reel',()=>{
 const r=plan(args('VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:middle:face=0.910:openart=newRejected1'));
 assert.equal(r.eligible,true);
 assert.equal(r.frozen_winner_recommendation_id,resolved.winner_recommendation_id);
 assert.equal(r.original_openart_history_id,'qAUQW2ZzqdasS0ePb1PD');
 assert.equal(r.fallback_static_claims_reel_success,false);
 assert.equal(r.source_and_caption_must_remain_unchanged,true);
 assert.equal(r.verified_actual_three_frames_required,true);
 assert.equal(r.independent_temporal_proof_required,true);
});
