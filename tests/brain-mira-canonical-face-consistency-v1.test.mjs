import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MIRA_MASTER_REFERENCE_ID,MIRA_MASTER_REFERENCE_URL,MIRA_FACE_CONSISTENCY_POLICY,validMiraGenerationReference,miraFaceProofValid} from '../supabase/functions/_shared/mira-canonical-face.mjs';
const config=JSON.parse(readFileSync('config/instagram-canonical-mira-identity-v1.json','utf8'));
const verifier=readFileSync('supabase/functions/powerhouse-instagram-media-verifier/index.ts','utf8');
const router=readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
const publisher=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const orchestrator=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
const sh='a'.repeat(64);
const frame=(position)=>({position,canonical_reference_id:MIRA_MASTER_REFERENCE_ID,canonical_reference_url:MIRA_MASTER_REFERENCE_URL,master_reference_sha256:sh,face_identity_match:true,face_identity_confidence:.96,identity_comparison_method:'two_image_vision'});
const proof={canonical_reference_id:MIRA_MASTER_REFERENCE_ID,canonical_reference_url:MIRA_MASTER_REFERENCE_URL,master_reference_sha256:sh,face_identity_match:true,face_identity_confidence:.96,identity_comparison_method:'two_image_vision',frame_evidence:['start','middle','end'].map(frame)};
test('master asset is existing verified OpenArt-only fictional Mira reference, never a user upload',()=>{
 assert.equal(config.canonical_reference.reference_id,MIRA_MASTER_REFERENCE_ID);
 assert.equal(config.canonical_reference.url,MIRA_MASTER_REFERENCE_URL);
 assert.equal(config.canonical_reference.verified_openart_reference_metadata,true);
 assert.equal(config.face_continuity.policy,MIRA_FACE_CONSISTENCY_POLICY);
 for(const id of config.forbidden_user_reference_ids)assert.notEqual(id,MIRA_MASTER_REFERENCE_ID);
});
test('generation source requires canonical master URL, ID, image-to-video and fresh history ID',()=>{
 const manifest={openart_reference_id:MIRA_MASTER_REFERENCE_ID,openart_reference_url:MIRA_MASTER_REFERENCE_URL,generation_mode:'image2video',openart_history_id:'new-history'};
 assert.equal(validMiraGenerationReference(manifest),true);
 for(const changes of [{openart_reference_id:'new-person'},{openart_reference_url:'https://example.com/fake.jpeg'},{generation_mode:'text2video'},{openart_history_id:''}])assert.equal(validMiraGenerationReference({...manifest,...changes}),false);
});
test('each of three exact final Reel frames must match master with high confidence and same SHA',()=>{
 assert.equal(miraFaceProofValid(proof,'reel'),true);
 assert.equal(miraFaceProofValid({...proof,face_identity_match:false},'reel'),false);
 assert.equal(miraFaceProofValid({...proof,face_identity_confidence:.89},'reel'),false);
 assert.equal(miraFaceProofValid({...proof,master_reference_sha256:'not-a-hash'},'reel'),false);
 for(const position of ['start','middle','end']){
  assert.equal(miraFaceProofValid({...proof,frame_evidence:proof.frame_evidence.filter(f=>f.position!==position)},'reel'),false);
  assert.equal(miraFaceProofValid({...proof,frame_evidence:proof.frame_evidence.map(f=>f.position===position?{...f,face_identity_match:false}:f)},'reel'),false);
 }
 assert.equal(miraFaceProofValid({...proof,canonical_reference_id:'other-person'},'reel'),false);
});
test('actual two-image vision call receives master and candidate; provenance is evidence not filename-only',()=>{
 assert.match(verifier,/masterBytes/);
 assert.match(verifier,/type:'image',source:\{type:'base64',media_type:'image\/jpeg',data:toBase64\(masterBytes\)/);
 assert.match(verifier,/type:'image',source:\{type:'base64',media_type:mediaType,data:toBase64\(bytes\)/);
 assert.match(verifier,/face_identity_match===true/);
 assert.match(verifier,/face_identity_confidence/);
 assert.match(verifier,/MIRA_CANONICAL_MASTER_UNAVAILABLE/);
});
test('existing router checks actual frames and refuses a nonmaster generation before provider truth',()=>{
 assert.match(router,/MIRA_FRESH_IMAGE2VIDEO_CANONICAL_MASTER_REQUIRED/);
 assert.match(router,/VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH/);
 assert.match(router,/MIRA_FACE_DRIFT_ACROSS_REEL_FRAMES/);
 assert.match(router,/MIRA_SAME_FACE_EXACT_MEDIA_GATE_FAILED/);
 assert.ok(router.indexOf('validMiraGenerationReference(manifest)')<router.indexOf('const final=await hashRemote(u)'));
 assert.ok(router.indexOf('MIRA_SAME_FACE_EXACT_MEDIA_GATE_FAILED')<router.indexOf("status:'PROOF_VERIFIED'"));
});
test('existing orchestrator/publisher maintain fail-closed face proof before Composio publish',()=>{
 assert.match(orchestrator,/miraFaceProofValid\(visual/);
 assert.match(publisher,/miraFaceProofValid\(visual,mediaType\)/);
 assert.match(publisher,/MIRA_CANONICAL_MASTER_FACE_NOT_VERIFIED/);
 assert.ok(publisher.indexOf('MIRA_CANONICAL_MASTER_FACE_NOT_VERIFIED')<publisher.indexOf('await consumePublishCapability(db,capability,runDate,row.channel'));
});
