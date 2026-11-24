// One canonical result gate: transport/provider failure is never a measured face mismatch.
// This evaluates only already completed verifier responses. It cannot publish or retry.
import {MIRA_IDENTITY_MIN_CONFIDENCE,miraFaceProofValid} from '../_shared/mira-canonical-face.mjs';

export function assessMiraFrameVerifierResult({http,body}={}){
  const status=Number(http);
  if(status!==200||body?.ok!==true){
    // Don't expose arbitrary response bodies, prompts, provider details or tenant data.
    return Object.freeze({kind:'PROVIDER_UNAVAILABLE',http_status:Number.isInteger(status)&&status>=100&&status<=599?status:null});
  }
  const visual=body.visual;
  const confidence=Number(visual?.face_identity_confidence);
  const measured=visual&&typeof visual==='object'
    &&typeof visual.face_identity_match==='boolean'
    &&visual.identity_comparison_method==='two_image_vision'
    &&Number.isFinite(confidence)&&confidence>=0&&confidence<=1;
  if(!measured)return Object.freeze({kind:'UNVERIFIED'});
  if(visual.face_identity_match!==true||confidence<MIRA_IDENTITY_MIN_CONFIDENCE){
    return Object.freeze({kind:'MEASURED_FACE_REJECTED',confidence});
  }
  if(body.pass!==true||!miraFaceProofValid(visual,'image')){
    return Object.freeze({kind:'OTHER_VISUAL_REJECTED'});
  }
  return Object.freeze({kind:'PASS'});
}
