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
const frame=(position)=>({position,canonical_reference_id:MIRA_MASTER_REFERENCE_ID,canonical_reference_url:MIRA_MASTER_REFERENCE_URL,master_reference_sha256:sh,face_identity_match:true,face_identity_confidence:.98,identity_comparison_method:'two_image_vision'});
const proof={canonical_reference_id:MIRA_MASTER_REFERENCE_ID,canonical_reference_url:MIRA_MASTER_REFERENCE_URL,master_reference_sha256:sh,face_identity_match:true,face_identity_confidence:.98,identity_comparison_method:'two_image_vision',frame_evidence:['start','middle','end'].map(frame)};
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
 assert.equal(miraFaceProofValid({...proof,face_identity_confidence:.93},'reel'),false);
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
 assert.match(router,/MIRA_CANONICAL_REFERENCE_VIDEO_REQUIRED/);
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


test('official Mira reference ID maps to live OpenArt resource, never expired CDN alias',()=>{
 const officialId='Yjqu4D7v76HABNPmQPj1';
 const resourceUrl='https://cdn.openart.ai/openart-ai/production/2026-09/create-image/WZvuT1BzGx566fWaFo8F/image_1790665568080_41c2e10a_1790665568142_c6e526dd.jpg';
 const staleUrl='https://cdn.openart.ai/openart-ai/production/2026-08/create-image/WZvuT1BzGx566fWaFo8F/021787044866478b825dd5258dc4c388f66926d17e5fb9c209d09_0_1787044876584_0c135418.jpeg';
 assert.equal(MIRA_MASTER_REFERENCE_ID,officialId);
 assert.equal(MIRA_MASTER_REFERENCE_URL,resourceUrl);
 assert.equal(config.canonical_reference.reference_id,officialId);
 assert.equal(config.canonical_reference.url,resourceUrl);
 assert.deepEqual(config.canonical_reference.dimensions,{width:928,height:1152});
 assert.equal(validMiraGenerationReference({openart_reference_id:officialId,openart_reference_url:staleUrl,openart_history_id:'history',generation_mode:'element2video'}),false);
});
