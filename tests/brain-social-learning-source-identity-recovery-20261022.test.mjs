import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(p,'utf8');

test('legacy Buffer collector cannot reintroduce a second scheduled sender',()=>{
 const collector=read('netlify/functions/buffer-social-collect.mjs');
 const workflow=read('.github/workflows/buffer-social-learning.yml');
 const suite=read('tests/social-learning-buffer-schedule.test.mjs');
 assert.match(collector,/export const config=\{\};/);
 assert.doesNotMatch(workflow,/^\s+schedule:\s*$/m);
 assert.match(suite,/assert\.equal\(config\.schedule, undefined/);
});

test('Mira router must precede channel-specific publisher and remain fail-closed',()=>{
 const loop=read('supabase/functions/powerhouse-content-loop/index.ts');
 const router=read('supabase/functions/powerhouse-instagram-media-router/index.ts');
 const routing=loop.indexOf("invoke(url, expected, 'powerhouse-instagram-media-router', { runDate })");
 const publish=loop.indexOf("['instagram_company','powerhouse-social-publisher',{runDate,mode:'publish_only',channels:['instagram_company']}]");
 assert.ok(routing>=0&&publish>routing);
 assert.match(router,/VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH/);
 assert.match(router,/MIRA_FACE_DRIFT_ACROSS_REEL_FRAMES/);
 assert.match(router,/!fv\.body\?\.pass\|\|!miraFaceProofValid\(/);
 assert.match(router,/MIRA_SAME_FACE_EXACT_MEDIA_GATE_FAILED/);
});

// Canonical learning-gate replay must execute all three unchanged original suites.
// Direct tests/social-* file inputs are excluded by the BRAIN evaluation allowlist.
import './social-learning-buffer-schedule.test.mjs';
import './social-learning-instagram-media-provider-routing-v1.test.mjs';
import './social-learning-instagram-video-frame-proof-worker-v1.test.mjs';
