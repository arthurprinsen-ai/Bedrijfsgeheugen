import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=(p)=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const loop=source('supabase/functions/powerhouse-content-loop/index.ts');
const router=source('supabase/functions/powerhouse-instagram-media-router/index.ts');
const social=source('supabase/functions/powerhouse-social-publisher/index.ts');
const migration=source('supabase/migrations/20261010130000_publication_media_lineage_preservation.sql');

test('single existing supervisor drains more than one channel within wall-time budget',()=>{
  assert.match(loop,/const MAX_CHANNEL_GENERATIONS = 3;/);
  assert.match(loop,/const MAX_GENERATION_ELAPSED_MS = 65_000;/);
  assert.match(loop,/Date\.now\(\) - loopStartedAt < MAX_GENERATION_ELAPSED_MS/);
  assert.doesNotMatch(loop,/!bootstrapAttempted/);
  assert.match(loop,/bootstrapStillInFlight = seeded\.timed_out === true \|\| seeded\.http === 0 \|\| !seeded\.ok/);
  assert.match(loop,/const leaseHolder = crypto\.randomUUID\(\)/);
  assert.match(loop,/invoke\(url, expected, 'powerhouse-social-publisher', \{ runDate, mode: 'publish_only' \}\)/);
});

test('media preflight never overwrites frame verification or forges complete proof',()=>{
  assert.match(router,/const preservingWork=assetMaterialized&&\['CLAIMED','GENERATING','VERIFYING','WAITING_PROOF'\]/);
  assert.match(router,/const state=verifiedMedia\?clean\(job\.status\):preservingWork\?clean\(job\.status\)/);
  assert.match(router,/if\(!verifiedMedia\)await db\.from\('content_publication_obligations'\)/);
  assert.match(router,/MIRA_MEDIA_MUST_MATCH_CANONICAL_BUSINESS_PROBLEM_AND_SCENE/);
  assert.match(router,/VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH/);
  assert.match(router,/MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED/);
  assert.match(router,/miraFaceProofValid/);
});

test('canonical DB ensure preserves video asset lineage for in-progress jobs',()=>{
  const guards=migration.match(/asset_manifest->>'openart_resource_id'/g)||[];
  assert.ok(guards.length >= 3, 'guard selected provider, exact asset and next action');
  assert.match(migration,/status in \('CLAIMED','GENERATING','VERIFYING','WAITING_PROOF','PROOF_VERIFIED','READY_TO_PUBLISH','LIVE_PROVEN'\)/);
  assert.match(migration,/asset_manifest=case/);
  assert.match(migration,/then public\.powerhouse_instagram_media_jobs_v1\.asset_manifest/);
  assert.match(migration,/provider_connection_state=case/);
  assert.match(migration,/republish_forbidden=public\.powerhouse_instagram_media_jobs_v1\.republish_forbidden or excluded\.republish_forbidden/);
  assert.doesNotMatch(migration,/set\s+proof_manifest\s*=/i);
});

test('successful personal LinkedIn publication removes old transport errors before terminal write',()=>{
  const personal=social.indexOf("if (row.channel === 'linkedin_personal') {");
  const company=social.indexOf("if (row.channel === 'linkedin_company') {",personal);
  const segment=social.slice(personal,company);
  assert.match(segment,/for\(const staleKey of \['error','provider_error','provider_auth_preflight','provider_auth_required'\]\) delete evidence\[staleKey\]/);
  assert.match(segment,/provider_create_success:true/);
  assert.match(segment,/consumePublishCapability\(db,capability,runDate,row\.channel,textHash,mediaSha\)/);
});

test('historical provider mutation, OAuth and global duplicate gates stay mandatory',()=>{
  for(const symbol of ['reserveGlobalUniquePublication(db,runDate,row.channel','issuePublishCapability(db,runDate,row.channel','consumePublishCapability(db,capability','preflightLinkedInCompanyViaComposio','LINKEDIN_COMMENTARY_LIMIT_EXCEEDED','MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED'])assert.ok(social.includes(symbol),symbol);
  assert.match(loop,/const OPERATIONAL_CHANNELS = \['linkedin_personal','linkedin_company','instagram','blog'\]/);
});

test('independently verified public LinkedIn proof survives optional GET_POST_CONTENT 403',()=>{
  const start=social.indexOf("if (row.channel === 'linkedin_personal' && (declaredProvider");
  const end=social.indexOf("if (row.channel === 'linkedin_company' && (",start);
  const reconcile=social.slice(start,end);
  assert.ok(start>0&&end>start);
  assert.match(reconcile,/publicProof\.independent_public_readback_verified===true/);
  assert.match(reconcile,/publicProof\.readback_exact_first_85_characters_matched===true/);
  assert.match(reconcile,/publicProof\.readback_exact_last_90_characters_matched===true/);
  assert.match(reconcile,/clean\(obligation\?\.canonical_url\)\.includes\(ref\)/);
  assert.match(reconcile,/provider_truth_source:'independent_public_linkedin_page'/);
  assert.match(reconcile,/recordObligation\(db,runDate,row\.channel,'LIVE_PROVEN',ref,evidence/);
  assert.match(reconcile,/republish_forbidden:true/);
});
