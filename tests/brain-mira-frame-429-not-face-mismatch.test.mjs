import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessMiraFrameVerifierResult} from '../supabase/functions/powerhouse-instagram-media-router/frame-verifier-result.mjs';
import {MIRA_MASTER_REFERENCE_ID,MIRA_MASTER_REFERENCE_URL} from '../supabase/functions/_shared/mira-canonical-face.mjs';

const provenVisual={
  face_identity_match:true,face_identity_confidence:0.962,
  identity_comparison_method:'two_image_vision',master_reference_sha256:'a'.repeat(64),
  canonical_reference_id:MIRA_MASTER_REFERENCE_ID,canonical_reference_url:MIRA_MASTER_REFERENCE_URL
};

test('OpenAI vision 429 provider error cannot become a Mira face mismatch',()=>{
  for(const http of [429,500,502,503]){
    const decision=assessMiraFrameVerifierResult({http,body:{ok:false,error:'VISION_PROVIDER_REQUEST_FAILED:'+http}});
    assert.deepEqual(decision,{kind:'PROVIDER_UNAVAILABLE',http_status:http});
  }
  assert.deepEqual(assessMiraFrameVerifierResult({http:200,body:{ok:false,error:'VISION_PROVIDER_REQUEST_FAILED:429'}}),
    {kind:'PROVIDER_UNAVAILABLE',http_status:200});
});

test('missing vision result cannot fabricate measured identity rejection',()=>{
  assert.equal(assessMiraFrameVerifierResult({http:200,body:{ok:true,pass:false}}).kind,'UNVERIFIED');
  assert.equal(assessMiraFrameVerifierResult({http:200,body:{ok:true,pass:false,visual:{face_identity_match:false}}}).kind,'UNVERIFIED');
});

test('only genuine numeric face evidence below 0.940 may reject identity',()=>{
  assert.deepEqual(assessMiraFrameVerifierResult({http:200,body:{ok:true,pass:false,visual:{...provenVisual,face_identity_confidence:0.939}}}),
    {kind:'MEASURED_FACE_REJECTED',confidence:0.939});
  assert.deepEqual(assessMiraFrameVerifierResult({http:200,body:{ok:true,pass:false,visual:{...provenVisual,face_identity_match:false}}}),
    {kind:'MEASURED_FACE_REJECTED',confidence:0.962});
});

test('high face score cannot override other actual creative-quality failures',()=>{
  assert.equal(assessMiraFrameVerifierResult({http:200,body:{ok:true,pass:false,visual:provenVisual}}).kind,'OTHER_VISUAL_REJECTED');
  assert.equal(assessMiraFrameVerifierResult({http:200,body:{ok:true,pass:true,visual:{...provenVisual,master_reference_sha256:null}}}).kind,'OTHER_VISUAL_REJECTED');
});

test('full independent measured identity still passes without lowering 0.940',()=>{
  assert.deepEqual(assessMiraFrameVerifierResult({http:200,body:{ok:true,pass:true,visual:provenVisual}}),{kind:'PASS'});
});

test('original media router inspects verdict BEFORE original rejection writer',()=>{
  const src=readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
  const section=src.slice(src.indexOf("const verdict=assessMiraFrameVerifierResult(fv);"));
  assert.ok(section.indexOf("verdict.kind==='PROVIDER_UNAVAILABLE'")>=0);
  assert.ok(section.indexOf("verdict.kind==='PROVIDER_UNAVAILABLE'")<section.indexOf("recordMediaProofRejection(db"));
  assert.ok(section.indexOf("verdict.kind==='MEASURED_FACE_REJECTED'")<section.indexOf("recordMediaProofRejection(db"));
  assert.match(section,/MIRA_FRAME_VISION_PROVIDER_UNAVAILABLE/);
  assert.doesNotMatch(section.slice(0,section.indexOf("verdict.kind==='MEASURED_FACE_REJECTED'")),/recordMediaProofRejection\(db/);
});
