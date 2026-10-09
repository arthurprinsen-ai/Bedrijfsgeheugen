// Canonical fictional Mira visual identity — reuse the verified original OpenArt master.
// One master across every content day. No reliance on text prompt/filename alone.
export const MIRA_MASTER_REFERENCE_ID='Yjqu4D7v76HABNPmQPj1';
export const MIRA_MASTER_REFERENCE_URL='https://cdn.openart.ai/openart-ai/production/2026-08/create-image/WZvuT1BzGx566fWaFo8F/021787044866478b825dd5258dc4c388f66926d17e5fb9c209d09_0_1787044876584_0c135418.jpeg';
export const MIRA_FACE_CONSISTENCY_POLICY='mira-master-two-image-face-continuity-v1';
export const MIRA_IDENTITY_MIN_CONFIDENCE=0.94;
export const MIRA_FORBIDDEN_REFERENCE_IDS=Object.freeze(['Jt5SWKRgyK3heTqEXH4w','w4HhwCmX5GxL8jTGljxe','umWzAKt6YBeoVpHlKTtK']);
export function validMiraGenerationReference(manifest={}){
 const id=String(manifest.openart_reference_id||'').trim();
 const url=String(manifest.openart_reference_url||'').trim();
 return id===MIRA_MASTER_REFERENCE_ID&&url===MIRA_MASTER_REFERENCE_URL&&!MIRA_FORBIDDEN_REFERENCE_IDS.includes(id)
  &&String(manifest.generation_mode||'').trim()==='image2video'
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
