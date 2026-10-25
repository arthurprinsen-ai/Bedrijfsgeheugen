// Exact, independently verified derivative is an eligible PROVIDER INPUT only,
// not a new canonical Mira master, a Reel PASS or permission to spend credits.
// Evidence was written by the original Supabase verifier (request #12791).
export const MIRA_DERIVED_VIDEO_INPUT_CONTRACT='mira-source-locked-pinned-portrait-video-input-v1';
export const MIRA_APPROVED_DERIVED_INPUT=Object.freeze({
 run_date:'2026-10-25',
 frozen_source:'0a56f150-2954-4355-a3d0-fc65396f8152',
 canonical_master_id:'Yjqu4D7v76HABNPmQPj1',
 canonical_master_sha256:'e32863f391e01dba910bf396ad13eb23c4a74b53f2614f1563b0fc332b1dd4e2',
 openart_project_id:'rUF5anXD47gVokckYjf9',
 image_history_id:'4aOsUdQyAheL3wmex9Uq',
 image_resource_id:'aTtGOimC7CyaexG5cyTh',
 image_url:'https://cdn.openart.ai/openart-ai/production/2026-10/create-image/WZvuT1BzGx566fWaFo8F/gpt-image-2-edit-1_1792950927245_6b325cb9.png',
 image_sha256:'242119866b6eaf9c142331e46b878df08c4f206fb4106fab2f48065b121b3b0a',
 proof_fingerprint:'mira-reference-candidate-vision-proof:2026-10-25:242119866b6eaf9c142331e46b878df08c4f206fb4106fab2f48065b121b3b0a',
 image_width:1296,image_height:2304,
 face_minimum:0.94
});

export function validatePinnedMiraDerivedInput({runDate,sourceId,masterId,projectId,derived,evidence}={}){
 const a=MIRA_APPROVED_DERIVED_INPUT;
 const base={contract:MIRA_DERIVED_VIDEO_INPUT_CONTRACT,
  approved_for_publish:false,verified_final_video:false,canonical_master_unchanged:true,
  video_requires_original_three_frame_face_and_temporal_proofs:true};
 if(runDate!==a.run_date||sourceId!==a.frozen_source||masterId!==a.canonical_master_id||
    projectId!==a.openart_project_id)return {...base,ok:false,error:'MIRA_DERIVED_INPUT_FROZEN_SOURCE_MISMATCH'};
 const proposed=derived&&typeof derived==='object'?derived:{};
 if(proposed.image_history_id!==a.image_history_id||proposed.image_resource_id!==a.image_resource_id||
    proposed.image_url!==a.image_url||proposed.image_sha256!==a.image_sha256)
   return {...base,ok:false,error:'MIRA_DERIVED_INPUT_NOT_PINNED'};
 if(!evidence||evidence.fingerprint!==a.proof_fingerprint||
    evidence.provider_status!=='reference_candidate_verified'||
    evidence.identity_gate_result!=='UNPROVEN'||
    evidence.exact_media_sha256!==a.image_sha256||
    evidence.media_url!==a.image_url)
   return {...base,ok:false,error:'MIRA_DERIVED_INPUT_INDEPENDENT_PROOF_MISSING'};
 const lineage=evidence.proof_lineage??{},visual=lineage.instagram_visual??{};
 if(lineage.reference_candidate_only!==true||
    lineage.verification_role!=='reference_candidate'||
    lineage.exact_final_media_proven!==false||
    visual.reference_candidate_visually_matched!==true||
    visual.canonical_reference_id!==a.canonical_master_id||
    visual.master_reference_sha256!==a.canonical_master_sha256||
    visual.identity_comparison_method!=='two_image_vision'||
    visual.face_identity_match!==true||
    !Number.isFinite(Number(visual.face_identity_confidence))||
    Number(visual.face_identity_confidence)<a.face_minimum||
    Number(visual.width)!==a.image_width||Number(visual.height)!==a.image_height)
   return {...base,ok:false,error:'MIRA_DERIVED_INPUT_FACE_LINEAGE_INVALID'};
 return {...base,ok:true,error:null,
  source_image_sha256:a.image_sha256,original_master_sha256:a.canonical_master_sha256,
  accepted_derived_input:{image_history_id:a.image_history_id,image_resource_id:a.image_resource_id,
   image_url:a.image_url,image_sha256:a.image_sha256,width:a.image_width,height:a.image_height},
  identity_similarity:Number(visual.face_identity_confidence),
  next_action:'Existing producer may request ONE separately budget-approved video generation anchored in this exact original-master-derived image, with actual provider input readback and full independent final-video proof; no direct Instagram publication.'};
}
