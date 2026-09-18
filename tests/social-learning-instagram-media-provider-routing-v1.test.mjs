import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const cfg=JSON.parse(fs.readFileSync('config/social-channel-identity-contract.json','utf8'));
const sql=fs.readFileSync('supabase/migrations/20260918110000_instagram_media_provider_router_v1.sql','utf8');
const router=fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
test('reels and videos require OpenArt',()=>{assert.match(sql,/required_provider','openart/);assert.match(router,/OPENART_REQUIRED_FOR_VIDEO/);});
test('images allow OpenArt or Placid',()=>{assert.match(sql,/jsonb_build_array\('openart','placid'\)/);});
test('carousel videos require OpenArt and image slides allow both',()=>{assert.match(sql,/INSTAGRAM_CAROUSEL_VIDEO_OPENART_REQUIRED/);assert.match(router,/CAROUSEL_VIDEO_OPENART_REQUIRED/);assert.match(router,/CAROUSEL_IMAGE_PROVIDER_INVALID/);});
test('router is proof-first and cannot publish',()=>{assert.match(router,/powerhouse-instagram-media-verifier/);assert.match(router,/PROOF_VERIFIED/);assert.doesNotMatch(router,/createPost|shareNow|BUFFER/);});
test('sent unproven lineage cannot duplicate',()=>{assert.match(router,/REPLACEMENT_REQUIRED/);assert.match(router,/republish_forbidden:true/);assert.match(router,/Never duplicate/);});
test('canonical channel contract carries the provider matrix',()=>{
 const p=cfg.channels.instagram_company.mediaPolicy;
 assert.equal(p.providerLineageRequired,true);
 assert.deepEqual(p.providerRouting.reel.allowedProviders,['openart']);
 assert.deepEqual(p.providerRouting.video.allowedProviders,['openart']);
 assert.deepEqual(p.providerRouting.image.allowedProviders,['openart','placid']);
 assert.deepEqual(p.providerRouting.carousel.imageSlideAllowedProviders,['openart','placid']);
 assert.deepEqual(p.providerRouting.carousel.videoSlideAllowedProviders,['openart']);
});

test('trigger function execute is service-role only',()=>{
 assert.match(sql,/revoke execute on function public\.powerhouse_validate_instagram_media_job_v1\(\) from public,anon,authenticated/i);
 assert.match(sql,/grant execute on function public\.powerhouse_validate_instagram_media_job_v1\(\) to service_role/i);
});
test('Instagram media job table is registered as a quality surface',()=>{
 const surfaces=JSON.parse(fs.readFileSync('config/powerhouse-quality-surface-contracts.json','utf8')).surfaces;
 assert.ok(surfaces.some(s=>s.id==='table:public.powerhouse_instagram_media_jobs_v1'));
});
