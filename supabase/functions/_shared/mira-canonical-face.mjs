// Canonical fictional Mira visual identity — reuse the verified original OpenArt master.
// One master across every content day. Bind reference ID and URL to the same OpenArt resource; do not trust a stale CDN alias or filename.
export const MIRA_MASTER_REFERENCE_ID='Yjqu4D7v76HABNPmQPj1';
export const MIRA_MASTER_REFERENCE_URL='https://cdn.openart.ai/openart-ai/production/2026-09/create-image/WZvuT1BzGx566fWaFo8F/image_1790665568080_41c2e10a_1790665568142_c6e526dd.jpg';
export const MIRA_FACE_CONSISTENCY_POLICY='mira-master-two-image-face-continuity-v1';
export const MIRA_IDENTITY_MIN_CONFIDENCE=0.94;
// OpenArt element2video uses the immutable master as an identity reference for a NEW scene.
// Keep legacy image2video for literal first-frame animation; reject free-text-only video.
export const MIRA_ALLOWED_REFERENCE_VIDEO_MODES=Object.freeze(['image2video','element2video']);
export const MIRA_FORBIDDEN_REFERENCE_IDS=Object.freeze(['Jt5SWKRgyK3heTqEXH4w','w4HhwCmX5GxL8jTGljxe','umWzAKt6YBeoVpHlKTtK']);
export function validMiraGenerationReference(manifest={}){
 const id=String(manifest.openart_reference_id||'').trim();
 const url=String(manifest.openart_reference_url||'').trim();
 return id===MIRA_MASTER_REFERENCE_ID&&url===MIRA_MASTER_REFERENCE_URL&&!MIRA_FORBIDDEN_REFERENCE_IDS.includes(id)
  &&MIRA_ALLOWED_REFERENCE_VIDEO_MODES.includes(String(manifest.generation_mode||'').trim())
  &&!!String(manifest.openart_history_id||'').trim();
}
export function miraFaceProofValid(visual={},mediaType='reel'){
 if(visual.canonical_reference_id!==MIRA_MASTER_REFERENCE_ID||visual.canonical_reference_url!==MIRA_MASTER_REFERENCE_URL)return false;
 if(visual.face_identity_match!==true||!Number.isFinite(Number(visual.face_identity_confidence))||Number(visual.face_identity_confidence)<MIRA_IDENTITY_MIN_CONFIDENCE)return false;
 if(typeof visual.master_reference_sha256!=='string'||!/^[0-9a-f]{64}$/.test(visual.master_reference_sha256))return false;
 if(visual.identity_comparison_method!=='two_image_vision')return false;
 if(mediaType==='reel'||mediaType==='video'){
   const f=Array.isArray(visual.frame_evidence)?visual.frame_evidence:[];
   if(!['start','middle','end'].every(pos=>f.some(frame=>frame.position===pos&&frame.face_identity_match===true&&frame.canonical_reference_id===MIRA_MASTER_REFERENCE_ID&&Number(frame.face_identity_confidence)>=MIRA_IDENTITY_MIN_CONFIDENCE&&frame.master_reference_sha256===visual.master_reference_sha256)))return false;
 }
 return true;
}
