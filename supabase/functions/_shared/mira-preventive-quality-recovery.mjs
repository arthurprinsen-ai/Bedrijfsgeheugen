// Source-led Mira: tell the original producer HOW to recover from a measured quality
// rejection before spending more OpenArt credits. This is not an approval or a
// publisher. Only independent exact-media verification can promote a candidate.
const FACE=/^VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:(start|middle|end):face=(\d+(?:\.\d+)?):openart=([A-Za-z0-9]+)$/;
const MOTION=/^MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED:confidence=(\d+(?:\.\d+)?):openart=([A-Za-z0-9]+)$/;
const clean=value=>String(value??'').trim();
export const MIRA_PREVENTIVE_RECOVERY_CONTRACT='mira-original-owner-pre-generation-quality-feedback-v1';

export function planMiraPreventiveRecovery({runDate,resolved,job,ob}={}){
 const error=clean(job?.last_error);
 const face=FACE.exec(error),motion=MOTION.exec(error),native=NATIVE.exec(error);
 const rejected=face?.[3]||motion?.[2]||native?.[3]||'';
 const failureClass=native?'NATIVE_VIDEO_FORMAT_INVALID':face?'FACE_REFERENCE_OR_FRAMING_DRIFT':motion?'TEMPORAL_HUMAN_MOTION_INSUFFICIENT':null;
 const immutableWinner=clean(resolved?.winner_recommendation_id);
 const sourceLocked=resolved?.kind==='approved_source_led' && !!immutableWinner &&
   !!clean(resolved?.scene) && !!clean(resolved?.openart_history_id);
 const sideEffectAbsent= !clean(ob?.external_id) && !ob?.live_proven_at &&
   ob?.evidence?.republish_forbidden!==true && job?.republish_forbidden!==true;
 const valid=!!runDate && sourceLocked && job?.status==='WAITING_PROOF' &&
   !!failureClass && !!rejected && sideEffectAbsent &&
   !!clean(job?.asset_manifest?.openart_project_id) &&
   clean(job?.asset_manifest?.openart_history_id)===clean(resolved.openart_history_id) &&
   clean(job?.asset_manifest?.recommendation_id)===immutableWinner;
 if(!valid)return {eligible:false,contract:MIRA_PREVENTIVE_RECOVERY_CONTRACT,reason:'NO_VERIFIED_SAME_OWNER_QUALITY_REJECTION'};
 // Concrete model feedback based on actual measured failure. Do NOT rewrite
 // the source winner or old evidence; only a newly generated distinct history
 // may be submitted for all the original verifier/publisher gates.
 const producerInstructions=native
  ? 'Real original MP4 is '+native[1]+'x'+native[2]+', not native 1080x1920. Select a model/setting that emits actual 9:16 full-bleed 1080x1920 video. Do not trust input manifest, letterbox, pad JPEG frames or rescale a previous history. Keep the fixed approved Mira master, frozen source and natural one-take motion.'
  :face
  ? 'Before requesting a new 9:16 generation, prevent letterboxing, black bars and face crops. Use the unchanged official Mira master as literal start/end reference. Keep her full recognizable face clear, centered and in stable light throughout; preserve approved parking-app scene, with authentic natural hand and expression motion. Reject a model output that is not full-bleed native portrait. Never relabel or re-score rejected frames.'
  : 'Create a single uninterrupted photorealistic 9:16 live scene with subtle but visible real human head, hand, blink and object interaction and consistent perspective; avoid slideshow, still-image pan/zoom, scene cuts and morphing. Use the unchanged official Mira master as literal start/end reference. Do not recycle this temporal-failed history.';
 return {
  eligible:true,
  contract:MIRA_PREVENTIVE_RECOVERY_CONTRACT,
  state:'AWAITING_NEW_SOURCE_LOCKED_CANDIDATE',
  failure_class:failureClass,
  rejected_history_id:rejected,
  observed_confidence:native?null:Number(face?.[2]||motion?.[1]),
  observed_native_width:native?Number(native[1]):null,
  observed_native_height:native?Number(native[2]):null,
  required_face_confidence:0.94,
  required_temporal_confidence:0.90,
  frozen_run_date:runDate,
  frozen_winner_recommendation_id:immutableWinner,
  frozen_scene:clean(resolved.scene),
  original_openart_history_id:clean(resolved.openart_history_id),
  existing_openart_project_id:clean(job.asset_manifest.openart_project_id),
  official_master_reference_id:clean(job.asset_manifest.openart_reference_id),
  permitted_format:'OPENART_NEW_MP4_NATIVE_1080x1920',
  generation_mode:'image2video',
  bounded_new_generations_per_decision:1,
  approved_executor:'EXISTING_CANONICAL_MIRA_PRODUCER_ONLY',
  producer_instructions:producerInstructions,
  candidate_must_have_distinct_history:true,
  source_and_caption_must_remain_unchanged:true,
  verified_actual_three_frames_required:true,
  independent_temporal_proof_required:true,
  protected_replacement_contract_required:true,
  meta_create_allowed_before_exact_media_pass:false,
  fallback_static_claims_reel_success:false,
  never_lower_thresholds:true,
  action:'GENERATE_AND_PREVALIDATE_DIFFERENT_MEDIA_THEN_SUBMIT_TO_ORIGINAL_ROUTER'
 };
}
