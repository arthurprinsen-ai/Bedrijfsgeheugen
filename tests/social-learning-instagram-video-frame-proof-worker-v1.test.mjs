import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const extractor=fs.readFileSync('netlify/functions/instagram-video-frames.mjs','utf8');
const verifier=fs.readFileSync('supabase/functions/powerhouse-instagram-media-verifier/index.ts','utf8');
const router=fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
const netlify=fs.readFileSync('netlify.toml','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));

test('Instagram reel proof extracts exact OpenArt video frames automatically',()=>{
  assert.equal(pkg.dependencies['ffmpeg-static'],'5.2.0');
  assert.match(netlify,/external_node_modules = \["ffmpeg-static"\]/);
  assert.match(extractor,/OPENART_CDN_URL_REQUIRED/);
  assert.match(extractor,/instagram-exact-video-frame-extraction-v1/);
  assert.match(extractor,/\['start'/);
  assert.match(extractor,/\['middle'/);
  assert.match(extractor,/\['end'/);
  assert.match(router,/FRAME_EXTRACTOR/);
  assert.match(router,/VIDEO_FRAME_EXTRACTION_FAILED/);
  assert.match(router,/imageBase64/);
});

test('transient frames still require canonical Mira vision proof',()=>{
  assert.match(verifier,/inlineInput/);
  assert.match(verifier,/\(!mediaUrl&&!inlineInput\)/);
  assert.doesNotMatch(verifier,/\|\|!mediaUrl\)return json\(\{ok:false,error:'INVALID_INPUT'/);
  assert.match(verifier,/inlineBase64/);
  assert.match(verifier,/MEDIA_BASE64_INVALID/);
  assert.match(verifier,/mira_present/);
  assert.match(verifier,/identity_class/);
  assert.match(verifier,/confidence/);
  assert.match(router,/VIDEO_FRAME_VISION_PROOF_FAILED/);
  assert.match(router,/visual_complete:true/);
  assert.match(router,/daily_life_scene:true/);
  assert.match(router,/confidence:Math\.min/);
  assert.match(router,/exact_final_media_proven:true/);
  assert.match(router,/mira_gate_passed:true/);
  assert.match(router,/asset_url:u/);
  assert.match(router,/daily_life_scene:true/);
});
