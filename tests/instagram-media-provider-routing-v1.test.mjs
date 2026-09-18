import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const sql=fs.readFileSync('supabase/migrations/20260918104500_instagram_media_provider_router_v1.sql','utf8');
const router=fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
test('reels and videos require OpenArt',()=>{assert.match(sql,/required_provider','openart/);assert.match(router,/OPENART_REQUIRED_FOR_VIDEO/);});
test('images allow OpenArt or Placid',()=>{assert.match(sql,/jsonb_build_array\('openart','placid'\)/);});
test('carousel videos require OpenArt and image slides allow both',()=>{assert.match(sql,/INSTAGRAM_CAROUSEL_VIDEO_OPENART_REQUIRED/);assert.match(router,/CAROUSEL_VIDEO_OPENART_REQUIRED/);assert.match(router,/CAROUSEL_IMAGE_PROVIDER_INVALID/);});
test('router is proof-first and cannot publish',()=>{assert.match(router,/powerhouse-instagram-media-verifier/);assert.match(router,/PROOF_VERIFIED/);assert.doesNotMatch(router,/createPost|shareNow|BUFFER/);});
test('sent unproven lineage cannot duplicate',()=>{assert.match(router,/REPLACEMENT_REQUIRED/);assert.match(router,/republish_forbidden:true/);assert.match(router,/Never duplicate/);});