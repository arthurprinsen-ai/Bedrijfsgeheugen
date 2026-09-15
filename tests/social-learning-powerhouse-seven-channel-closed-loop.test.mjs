import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationPath='supabase/migrations/20260915113000_powerhouse_seven_channel_closed_loop_completion.sql';
const orchestratorPath='supabase/functions/powerhouse-content-orchestrator/index.ts';
const publisherPath='supabase/functions/powerhouse-social-publisher/index.ts';

const read=(p)=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
const migration=read(migrationPath);
const orchestrator=read(orchestratorPath);
const publisher=read(publisherPath);

const lanes=['email_newsletter','linkedin_personal','linkedin_company','linkedin_article_personal','linkedin_article_company','instagram_company','blog'];

test('publication ledger projects the exact seven canonical Powerhouse lanes',()=>{
 assert.ok(migration,'seven-channel completion migration must exist');
 for(const lane of lanes) assert.match(migration,new RegExp(`'${lane}'`));
 assert.match(migration,/content_kind[\s\S]*'email'[\s\S]*'article'/i);
 assert.match(migration,/sync_content_publication_obligations/i);
 assert.match(migration,/instagram_company/);
 assert.match(migration,/legacy[^\n]*instagram|instagram[^\n]*legacy/i);
});

test('cockpit is one projection of Brain decisions and publication execution',()=>{
 assert.match(migration,/create or replace view public\.content_operations_cockpit/i);
 assert.match(migration,/powerhouse_channel_decisions/i);
 for(const field of ['decision','priority','confidence','topic_key','content_key','scheduled_for','delivery_ref','delivery_evidence']) assert.match(migration,new RegExp(field));
});

test('hard daily social lanes cannot be satisfied by SKIPPED',()=>{
 for(const lane of ['linkedin_personal','linkedin_company','instagram_company']) assert.match(migration,new RegExp(`'${lane}'`));
 assert.match(migration,/HARD_SOCIAL|hard_social/i);
 assert.match(migration,/SKIPPED/);
 assert.match(migration,/SILENT_PUBLICATION_FAILURE/);
 assert.match(migration,/expected[^\n]*7|=\s*7/);
});

test('orchestrator persists all seven decisions and keeps hard social as real obligations',()=>{
 assert.ok(orchestrator,'orchestrator source must be version controlled');
 for(const lane of lanes) assert.match(orchestrator,new RegExp(`'${lane}'`));
 assert.match(orchestrator,/HARD_SOCIAL/);
 assert.match(orchestrator,/instagram_company/);
 assert.doesNotMatch(orchestrator,/instagram_company:false/);
 assert.match(orchestrator,/content_operations|content_publication_obligations|recovery/i);
});

test('orchestrator error path preserves the real root cause',()=>{
 assert.ok(orchestrator);
 assert.doesNotMatch(orchestrator,/\.insert\([^;]+\)\.catch\(/s);
 assert.match(orchestrator,/powerhouse-content-orchestrator/);
});

test('social publisher supports Instagram only with an explicit verified Mira media gate',()=>{
 assert.ok(publisher,'social publisher source must be version controlled');
 assert.match(publisher,/6a70384d99afb44349f0fba9/);
 assert.match(publisher,/instagram_company/);
 assert.match(publisher,/mira_verified===true|miraVerified===true/);
 assert.doesNotMatch(publisher,/media_gate==='Mira'/);
 assert.match(publisher,/assetUrl|asset_url/);
 assert.match(publisher,/mediaKind|media_kind/);
 assert.match(publisher,/INSTAGRAM_MEDIA_REQUIRED|INSTAGRAM.*MEDIA.*REQUIRED/);
 assert.match(publisher,/blocked/i);
});

test('publisher does not rely on an undeclared PostgREST relationship',()=>{
 assert.doesNotMatch(publisher,/select\(['"][^'"]*powerhouse_content_artifacts\(/);
 assert.match(publisher,/from\('powerhouse_content_artifacts'\)\.select\('body,generation_evidence,status'\)/);
 assert.match(publisher,/ARTIFACT_READ|ARTIFACT_MISSING/);
});
