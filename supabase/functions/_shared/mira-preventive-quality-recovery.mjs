// Source-led Mira: tell the original producer HOW to recover from a measured quality
// rejection before spending more OpenArt credits. This is not an approval or a
// publisher. Only independent exact-media verification can promote a candidate.
const FACE=/^VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH:(start|middle|end):face=(\d+(?:\.\d+)?):openart=([A-Za-z0-9]+)$/;
const MOTION=/^MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED:confidence=(\d+(?:\.\d+)?):openart=([A-Za-z0-9]+)$/;
const NATIVE=/^MIRA_NATIVE_VIDEO_DIMENSIONS_MISMATCH:(\d{2,5})x(\d{2,5}):openart=([A-Za-z0-9]+)$/;
const clean=value=>String(value??'').trim();
export const MIRA_PREVENTIVE_RECOVERY_CONTRACT='mira-original-owner-pre-generation-quality-feedback-v1';

export const MIRA_PRODUCER_MOTION_COMPATIBILITY_CONTRACT='mira-recognizable-face-and-genuine-human-motion-v1';

// The previous real model prompts asked to lock the face and every facial pixel
// throughout the video while the actual independent temporal gate required
// natural visible HUMAN movement. Reject that impossible brief BEFORE credits
// are spent. Stable identity is not the same as a literal frozen facial plate.
export function checkMiraProducerPromptCompatibility(prompt=''){
 const source=String(prompt??'');
 const p=source.toLowerCase().replace(/\\s+/g,' ');
 const violations=[];
 if(/(?:frozen (?:facial|face|head|portrait)|freeze (?:the )?(?:face|head|person|entire person)|(?:lock|preserve) (?:every|all) (?:facial|face) (?:landmarks(?: and pixels?)?|pixels?)|(?:face|facial area|entire head) (?:is|are|must be|as) (?:a )?(?:photographically )?frozen (?:photographic )?plate|(?:pixel-perfect|identical) (?:facial|face) pixels?)/i.test(p))
   violations.push('IMPOSSIBLE_FROZEN_FACE_REQUIREMENT');
 if(/(?:no (?:blinking|blink|breathing|human motion|facial animation|facial movement|head movement|hand movement)|(?:do not|never) (?:blink|breathe|move (?:her |the )?(?:head|hands|face)|have her move))/i.test(p))
   violations.push('SUPPRESSED_NATURAL_HUMAN_MOTION');
 if(/(?:motion only (?:in|on|of) (?:the )?(?:background|desk|phone|object)|(?:entire person|whole body) (?:perfectly |completely )?(?:still|static)|still (?:portrait|photo) (?:with|on) (?:moving|animated) background)/i.test(p))
   violations.push('BACKGROUND_ONLY_FAKE_VIDEO');
 if(!/(?:finger|hand|blink|breathing|human|head|gesture|interact)/i.test(source))
   violations.push('NO_GROUNDED_HUMAN_ACTION');
 return {ok:violations.length===0,contract:MIRA_PRODUCER_MOTION_COMPATIBILITY_CONTRACT,violations};
}

export function buildMiraSourceLockedMotionBrief({scene,masterReferenceId,runDate}={}){
 const frozenScene=String(scene??'').trim();
 const master=String(masterReferenceId??'').trim();
 if(!frozenScene||!master||!/^20\\d{2}-\\d{2}-\\d{2}$/.test(String(runDate??'')))
   return {ok:false,contract:MIRA_PRODUCER_MOTION_COMPATIBILITY_CONTRACT,reason:'MISSING_FROZEN_SOURCE_OR_ORIGINAL_MASTER'};
 const prompt=[
  'Produce ONE photorealistic 8-second continuous-shot Instagram Reel, true native full-bleed 1080x1920 portrait 9:16. No black bars, text overlays, camera cuts, pan, zoom, reframing or identity swaps.',
  'Use only the original approved Mira master reference as the actual original start/end frame input according to the currently permitted image2video contract. Preserve the SAME recognizable adult woman: face structure, age, hair, skin features and clothing. Keep her entire face unobscured, naturally framed and consistently illuminated, without redesign, morphing, beautifying, flicker or extreme head turns.',
  'Keep the already-frozen source scene exactly: '+frozenScene,
  'The character must be visibly alive throughout the shot: subtle natural blinking, small plausible breathing and one small unhurried HAND/finger interaction with the existing object already present in the approved scene. One continuous human action with physically coherent face and hand movement, no slideshow, still photograph animation or background-only motion.',
  'Prioritize identity and a coherent living human over exaggerated expression. No deliberate face lock, pixel-frozen face, mannequin pose or motionless human. Keep motion restrained enough for the actual original-master face verification at first, middle and last frame.',
  'No voice, music, logos, legible third-party app brands, new characters, invented claims or altered editorial context. Output a genuinely NEW OpenArt provider history in the original project; do not reuse a rejected history.'
 ].join(' ');
 const compatibility=checkMiraProducerPromptCompatibility(prompt);
 if(!compatibility.ok)return {ok:false,contract:MIRA_PRODUCER_MOTION_COMPATIBILITY_CONTRACT,reason:'PRODUCER_BRIEF_SELF_CONTRADICTORY',violations:compatibility.violations};
 return {ok:true,contract:MIRA_PRODUCER_MOTION_COMPATIBILITY_CONTRACT,
  run_date:runDate,official_master_reference_id:master,scene:frozenScene,
  permitted_generation_mode:'image2video',native_dimensions:'1080x1920',
  duration_seconds:8,requires_real_human_motion:true,
  source_and_identity_unchanged:true,openart_credits_cap_enforced_externally:true,
  prompt,compatibility};
}



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
  // Compatible human-motion brief follows the existing frozen source. Before
  // any paid provider call, original producer must also lint its FINAL prompt.
  motion_compatible_brief:buildMiraSourceLockedMotionBrief({
    scene:resolved.scene,masterReferenceId:job.asset_manifest.openart_reference_id,runDate
  }),
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
