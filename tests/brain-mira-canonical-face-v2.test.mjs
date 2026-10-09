import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const cfg=JSON.parse(read('config/instagram-canonical-mira-identity-v1.json'));
const verifier=read('supabase/functions/powerhouse-instagram-media-verifier/index.ts');
const router=read('supabase/functions/powerhouse-instagram-media-router/index.ts');
const orchestrator=read('supabase/functions/powerhouse-content-orchestrator/index.ts');
const publisher=read('supabase/functions/powerhouse-social-publisher/index.ts');
const sql=read('supabase/migrations/20261009151000_mira_master_face_identity_gate_v2.sql');
const master='Yjqu4D7v76HABNPmQPj1';
test('one immutable fictional OpenArt master is the identity source, not user photos',()=>{
 assert.equal(cfg.canonical_reference.reference_id,master);
 assert.match(cfg.canonical_reference.url,/^https:\/\/cdn\.openart\.ai\//);
 assert.equal(cfg.generation.image.includes('image2image'),true);
 assert.equal(cfg.generation.reel.includes('image2video'),true);
 assert.ok(cfg.forbidden_user_reference_ids.length>0);
 assert.equal(cfg.identity_consistency.minimum_visual_confidence,0.94);
});
test('actual master pixels, not labels or metadata alone, are sent to image verifier',()=>{
 assert.match(verifier,/MIRA_MASTER_URL/);
 assert.match(verifier,/await fetch\(MIRA_MASTER_URL/);
 assert.match(verifier,/sha256\(masterBytes\)/);
 assert.match(verifier,/media_type:masterType,data:toBase64\(masterBytes\)/);
 assert.match(verifier,/media_type:mediaType,data:toBase64\(bytes\)/);
 assert.match(verifier,/canonical_identity_match===true/);
 assert.match(verifier,/canonical_identity_confidence\)>=0\.94/);
 assert.match(verifier,/canonical_master_sha256:masterSha/);
});
test('router denies new text-only generated lookalikes and mismatched Reel frames',()=>{
 assert.match(router,/MIRA_CANONICAL_OPENART_MASTER_INPUT_REQUIRED/);
 assert.match(router,/MIRA_MASTER_DERIVED_START_FRAME_AND_IMAGE2VIDEO_REQUIRED/);
 assert.match(router,/MIRA_SAME_MASTER_ALL_THREE_FRAMES_REQUIRED/);
 assert.match(router,/VIDEO_FRAME_MASTER_FACE_MISMATCH/);
 assert.match(router,/canonical_master_sha256:fps\[0\]\.canonical_master_sha256/);
 assert.match(router,/MIRA_CANONICAL_VISUAL_IDENTITY_NOT_PROVEN/);
});
test('no Instagram publication without three same-master frame proofs and current canonical business scene',()=>{
 assert.match(orchestrator,/canonical_identity_match === true/);
 assert.match(orchestrator,/\['start','middle','end'\]\.every\(position/);
 assert.match(publisher,/const sameMaster=/);
 assert.match(publisher,/&&visible&&dims&&providerOk&&sameMaster/);
 assert.match(publisher,/MIRA_MEDIA_CAPTION_SCENE_MISMATCH/);
 assert.ok(publisher.indexOf('const sameMaster=')<publisher.indexOf('await publishInstagramViaComposio'));
});
test('existing trigger requires master URL, image-based source, visual master and 3 frames',()=>{
 assert.match(sql,/create or replace function public\.powerhouse_validate_instagram_media_job_v1\(\)/i);
 assert.match(sql,/MIRA_MASTER_SOURCE_URL_REQUIRED/);
 assert.match(sql,/MIRA_CANONICAL_IMAGE_DERIVED_VIDEO_REQUIRED/);
 assert.match(sql,/MIRA_MASTER_FACE_VISUAL_MATCH_REQUIRED/);
 assert.match(sql,/MIRA_MASTER_ALL_THREE_FRAMES_REQUIRED/);
 assert.match(sql,/jsonb_array_elements/);
 assert.doesNotMatch(sql,/cron\.schedule\s*\(/);
 assert.equal((sql.match(/revoke execute on function/g)||[]).length,1);
});
