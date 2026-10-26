import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MIRA_DERIVED_PORTRAIT_ROLE,MIRA_DERIVED_PORTRAIT_CONTRACT,miraProofDimensions} from '../supabase/functions/_shared/mira-reference-candidate-proof.mjs';

const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('true 9:16 OpenArt-derived reference has a separate identity-only proof role',()=>{
 const x=miraProofDimensions(1296,2304,MIRA_DERIVED_PORTRAIT_ROLE);
 assert.equal(x.ok,true);
 assert.equal(x.reference_candidate_only,true);
 assert.equal(x.contract,MIRA_DERIVED_PORTRAIT_CONTRACT);
 assert.equal(x.expected_width,1296);
 assert.equal(x.expected_height,2304);
 assert.equal(miraProofDimensions(1080,1920,'reference_candidate').ok,false);
});
test('unchanged current official image/Reel frame dimension requirements',()=>{
 assert.equal(miraProofDimensions(1080,1350,'static_image').ok,true);
 assert.equal(miraProofDimensions(1080,1920,'video_frame').ok,true);
 assert.equal(miraProofDimensions(1296,2304,'video_frame').ok,false);
 assert.equal(miraProofDimensions(1296,2304,'static_image').ok,false);
 assert.equal(miraProofDimensions(1296,2304,'unknown').ok,false);
});
test('candidate-only verifier is provider-specific, cannot rewrite Instagram obligation',()=>{
 const s=file('supabase/functions/powerhouse-instagram-media-verifier/index.ts');
 const src=s.indexOf("const referenceCandidate=verificationRole===MIRA_DERIVED_PORTRAIT_ROLE");
 const guarded=s.indexOf("const writeObligation=!referenceCandidate && body.writeObligation!==false",src);
 const mutation=s.indexOf("if(writeObligation){",guarded);
 assert.ok(src>0&&guarded>src&&mutation>guarded);
 assert.match(s,/MIRA_REFERENCE_PROVIDER_ASSET_REQUIRED/);
 assert.match(s,/mediaUrl\.startsWith\('https:\/\/cdn\.openart\.ai\/openart-ai\/production\/'\)/);
 assert.match(s,/reference_candidate_verified/);
 assert.match(s,/exact_final_media_proven:!referenceCandidate&&pass/);
 assert.match(s,/reference_candidate_only:referenceCandidate/);
 assert.match(s,/reference_candidate_visually_matched:referenceCandidate&&pass/);
 assert.match(s,/identity_gate_result:referenceCandidate\?'UNPROVEN'/);
 assert.match(s,/mira-reference-candidate-vision-proof:/);
 assert.match(s,/verified:!referenceCandidate&&pass/);
 assert.match(s,/may_publish:!referenceCandidate&&pass/);
 assert.match(s,/canonical_master_unchanged:true/);
});
test('original master and strict facial confidence remain pinned, no video proof or Meta sending',()=>{
 const m=file('supabase/functions/_shared/mira-canonical-face.mjs');
 const verifier=file('supabase/functions/powerhouse-instagram-media-verifier/index.ts');
 assert.match(m,/MIRA_MASTER_REFERENCE_ID='Yjqu4D7v76HABNPmQPj1'/);
 assert.match(m,/MIRA_IDENTITY_MIN_CONFIDENCE=0\.94/);
 assert.match(verifier,/Number\(verdict.face_identity_confidence\)>=MIRA_IDENTITY_MIN_CONFIDENCE/);
 assert.match(verifier,/two_image_vision/);
 assert.match(verifier,/writeObligation=!referenceCandidate/);
});
