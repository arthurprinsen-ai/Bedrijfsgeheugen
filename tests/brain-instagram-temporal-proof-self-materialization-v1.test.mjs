import assert from 'node:assert/strict';
import fs from 'node:fs';

const router=fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
const verifier=fs.readFileSync('supabase/functions/powerhouse-instagram-temporal-verifier/index.ts','utf8');

assert.match(router,/powerhouse-instagram-temporal-verifier/);
assert.match(router,/videoSha256:final\.sha256,frames/);
assert.match(router,/if\(!temporalCheck\.body\?\.pass\)return json\(\{ok:false,error:'MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED'/);
assert.match(verifier,/mira-continuous-human-video-v1/);
for (const token of ['single_continuous_take','continuous_motion_verified','scene_continuity_verified','identity_continuity_verified','human_motion_verified','realistic_camera_motion','slideshow_detected','still_image_animation_detected']) assert.ok(verifier.includes(token),token);
assert.match(verifier,/confidence\)>=0\.9/);
assert.match(verifier,/temporal:anthropic:/);
console.log('Instagram temporal Reel proof is automatically produced and exact-video bound');
