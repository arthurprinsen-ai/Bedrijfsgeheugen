// Pure role/dimension policy. Existing production Instagram media roles are
// unchanged. An outpainted reference is staging evidence, NEVER an approved
// Instagram Reel or a new canonical Mira master.
export const MIRA_DERIVED_PORTRAIT_ROLE='reference_candidate';
export const MIRA_DERIVED_PORTRAIT_CONTRACT='mira-outpainted-reference-independent-face-proof-v1';
export function miraProofDimensions(width,height,role='static_image'){
 const r=String(role||'static_image');
 const options={
  static_image:{width:1080,height:1350},
  video_frame:{width:1080,height:1920},
  [MIRA_DERIVED_PORTRAIT_ROLE]:{width:1296,height:2304}
 };
 if(!Object.hasOwn(options,r))return {ok:false,error:'MIRA_VERIFICATION_ROLE_UNSUPPORTED',role:r};
 const d=options[r];
 return {ok:Number(width)===d.width&&Number(height)===d.height,
   role:r,expected_width:d.width,expected_height:d.height,
   reference_candidate_only:r===MIRA_DERIVED_PORTRAIT_ROLE,
   contract:MIRA_DERIVED_PORTRAIT_CONTRACT};
}
