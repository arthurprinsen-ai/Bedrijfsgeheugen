import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cfg=JSON.parse(fs.readFileSync('config/social-channel-identity-contract.json','utf8'));
const sql=fs.readFileSync('supabase/migrations/20260920073022_instagram_mira_visual_reel_only_v2.sql','utf8');
const router=fs.readFileSync('supabase/functions/powerhouse-instagram-media-router/index.ts','utf8');
const contentLoop=fs.readFileSync('supabase/functions/powerhouse-content-loop/index.ts','utf8');

test('Instagram provider policy permits only Mira image or Reel',()=>{
  assert.match(sql,/not in \('image','reel'\)/);
  assert.match(sql,/INSTAGRAM_MIRA_VISUAL_OR_REEL_ONLY/);
  assert.match(sql,/required_provider','openart'/);
});

test('router fail-closes non image/reel and requires OpenArt',()=>{
  assert.match(router,/INSTAGRAM_MIRA_VISUAL_OR_REEL_ONLY/);
  assert.match(router,/OPENART_REQUIRED_FOR_MIRA_VISUAL/);
  assert.doesNotMatch(router,/postType==='reel'\|\|postType==='video'/);
});

test('router is proof-first and cannot publish',()=>{
  assert.match(router,/powerhouse-instagram-media-verifier/);
  assert.match(router,/PROOF_VERIFIED/);
  assert.doesNotMatch(router,/createPost|shareNow|BUFFER/);
});

test('sent unproven lineage cannot duplicate',()=>{
  assert.match(router,/REPLACEMENT_REQUIRED/);
  assert.match(router,/republish_forbidden:true/);
  assert.match(router,/Never duplicate/);
});

test('canonical channel contract carries exact v2 provider matrix',()=>{
 const p=cfg.channels.instagram_company.mediaPolicy;
 assert.equal(p.providerLineageRequired,true);
 assert.deepEqual(p.allowedKinds,['image','reel']);
 assert.deepEqual(p.providerRouting.reel.allowedProviders,['openart']);
 assert.equal(p.providerRouting.reel.requiredProvider,'openart');
 assert.deepEqual(p.providerRouting.image.allowedProviders,['openart']);
 assert.equal(p.providerRouting.image.requiredProvider,'openart');
 assert.equal(cfg.channels.instagram_company.requiresMiraCentralSubject,true);
 assert.equal(cfg.channels.instagram_company.blocksTextDominantCreative,true);
 assert.equal(cfg.channels.instagram_company.blocksBrandTemplateDominantCreative,true);
});

test('trigger function execute is service-role only',()=>{
 assert.match(sql,/revoke execute on function public\.powerhouse_validate_instagram_media_job_v1\(\) from public,anon,authenticated/i);
 assert.match(sql,/grant execute on function public\.powerhouse_validate_instagram_media_job_v1\(\) to service_role/i);
});

test('Instagram media job table is registered as a quality surface',()=>{
 const surfaces=JSON.parse(fs.readFileSync('config/powerhouse-quality-surface-contracts.json','utf8')).surfaces;
 assert.ok(surfaces.some(s=>s.id==='table:public.powerhouse_instagram_media_jobs_v1'));
});

test('content loop invokes Instagram router as real TypeScript before publish',()=>{
 assert.match(contentLoop,/stepResults\.push\(await invoke\(url, expected, 'powerhouse-instagram-media-router', \{ runDate \}\)\);/);
 const routerPos=contentLoop.indexOf("'powerhouse-instagram-media-router'");
 const publishPos=contentLoop.indexOf("'powerhouse-social-publisher', { runDate }");
 assert.ok(routerPos>=0);
 assert.ok(publishPos>routerPos);
});

test('materialized provider asset cannot regress to waiting-provider-connection',()=>{
 assert.match(router,/const assetMaterialized=/);
 assert.match(router,/assetMaterialized\?'WAITING_PROOF'/);
 assert.match(router,/assetMaterialized\?'ASSET_MATERIALIZED'/);
 assert.match(router,/Exact asset already materialized; submit it with required frame\/image evidence for canonical vision proof/);
});


test('media router uses the frozen winner job format before recommendation metadata', () => {
  const winnerMigration = fs.readFileSync('supabase/migrations/20260920110000_instagram_daily_winner_lineage_v1.sql', 'utf8');
  assert.match(router, /inferType\(input\.postType,job\?\.post_type/);
  assert.match(router, /generation_evidence\?\.daily_winner_format/);
  assert.match(winnerMigration, /powerhouse_ensure_instagram_media_job_v1/);
  assert.match(winnerMigration, /daily_winner_recommendation_id/);
});
