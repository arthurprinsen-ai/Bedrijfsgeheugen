import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MIRA_APPROVED_DERIVED_INPUT as a,validatePinnedMiraDerivedInput as verify}
  from '../supabase/functions/_shared/mira-approved-derived-video-input.mjs';
const evidence={
 fingerprint:a.proof_fingerprint,provider_status:'reference_candidate_verified',identity_gate_result:'UNPROVEN',
 exact_media_sha256:a.image_sha256,media_url:a.image_url,
 proof_lineage:{
  reference_candidate_only:true,verification_role:'reference_candidate',exact_final_media_proven:false,
  instagram_visual:{
   reference_candidate_visually_matched:true,canonical_reference_id:a.canonical_master_id,
   master_reference_sha256:a.canonical_master_sha256,identity_comparison_method:'two_image_vision',
   face_identity_match:true,face_identity_confidence:0.95,width:1296,height:2304
  }
 }
};
const derived={image_history_id:a.image_history_id,image_resource_id:a.image_resource_id,
 image_url:a.image_url,image_sha256:a.image_sha256};
const req={runDate:a.run_date,sourceId:a.frozen_source,masterId:a.canonical_master_id,
 projectId:a.openart_project_id,derived,evidence};
test('real 0.950 independent vision source may be used ONLY as derived generation input',()=>{
 const x=verify(req);
 assert.equal(x.ok,true);
 assert.equal(x.identity_similarity,0.95);
 assert.equal(x.approved_for_publish,false);
 assert.equal(x.verified_final_video,false);
 assert.equal(x.canonical_master_unchanged,true);
 assert.equal(x.accepted_derived_input.image_sha256,a.image_sha256);
});
test('fake success, changed master, different source/day, unproven bytes and lookalikes all fail closed',()=>{
 for(const arg of [
  {...req,masterId:'not-original'},
  {...req,sourceId:'another-winner'},
  {...req,runDate:'2026-10-26'},
  {...req,projectId:'other-openart-project'},
  {...req,derived:{...derived,image_sha256:'0'.repeat(64)}},
  {...req,derived:{...derived,image_resource_id:'another-id'}},
  {...req,evidence:{...evidence,identity_gate_result:'PASS'}},
  {...req,evidence:{...evidence,provider_status:'prepublish_verified'}},
  {...req,evidence:{...evidence,exact_media_sha256:'0'.repeat(64)}},
  {...req,evidence:{...evidence,proof_lineage:{...evidence.proof_lineage,exact_final_media_proven:true}}},
  {...req,evidence:{...evidence,proof_lineage:{...evidence.proof_lineage,instagram_visual:{...evidence.proof_lineage.instagram_visual,face_identity_confidence:0.93}}}},
  {...req,evidence:null},
 ]){
   assert.equal(verify(arg).ok,false,JSON.stringify(arg).slice(0,180));
 }
});
test('production router verifies immutable DB proof before new model spend or final media acceptance',()=>{
 const s=readFileSync(new URL('../supabase/functions/powerhouse-instagram-media-router/index.ts',import.meta.url),'utf8');
 assert.match(s,/MIRA_APPROVED_DERIVED_INPUT\.proof_fingerprint/);
 assert.match(s,/validatePinnedMiraDerivedInput\(/);
 assert.match(s,/const derivedInput=input\.derivedReference/);
 assert.match(s,/const eligible=config\.ok&&\(derivedInput===null\|\|derivedInput\.ok===true\)/);
 assert.match(s,/const derivedInput=manifest\.derived_reference/);
 assert.match(s,/if\(derivedInput!==null&&!derivedInput\.ok\)/);
 assert.match(s,/proof\.mira_derived_generation_input/);
 assert.match(s,/provider_input_readback_required:true/);
 assert.match(s,/validMiraGenerationReference\(manifest\)/);
 assert.match(s,/MIRA_OPENART_HISTORY_PREVIOUSLY_REJECTED/);
 assert.match(s,/powerhouse-instagram-temporal-verifier/);
});
test('original Mira face threshold and Reel truth checks stay unchanged',()=>{
 const s=readFileSync(new URL('../supabase/functions/_shared/mira-canonical-face.mjs',import.meta.url),'utf8');
 assert.match(s,/MIRA_IDENTITY_MIN_CONFIDENCE=0\.94/);
 assert.match(s,/MIRA_MASTER_REFERENCE_ID='Yjqu4D7v76HABNPmQPj1'/);
});
