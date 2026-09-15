import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(p)=>fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
const migration=read('supabase/migrations/20260915172000_powerhouse_source_parity_instagram_v1.sql');
const orchestrator=read('supabase/functions/powerhouse-content-orchestrator/index.ts');
const publisher=read('supabase/functions/powerhouse-social-publisher/index.ts');

const lanes=['email_newsletter','linkedin_personal','linkedin_company','linkedin_article_personal','linkedin_article_company','instagram_company','blog'];

test('live Brain revenue projection is source controlled against canonical Powerhouse tables',()=>{
  assert.ok(migration,'source parity migration must exist');
  assert.match(migration,/powerhouse_project_brain_revenue_learning/i);
  assert.match(migration,/trg_powerhouse_project_brain_revenue_learning/i);
  for(const table of ['powerhouse_forecasts','powerhouse_sales_actions','powerhouse_sales_outcomes','powerhouse_forecast_calibration']) {
    assert.match(migration,new RegExp(`public\\.${table}`,'i'));
  }
  assert.match(migration,/originatingPredictionId/);
  assert.match(migration,/canonical_brain_record_id/);
  assert.doesNotMatch(migration,/create\s+table/i,'source parity must not create parallel persistence');
});

test('orchestrator source preserves seven-lane and identity fail-closed contracts',()=>{
  assert.ok(orchestrator,'deployed orchestrator must be source controlled');
  for(const lane of lanes) assert.match(orchestrator,new RegExp(`'${lane}'`));
  assert.match(orchestrator,/arthur-personal-linkedin-identity-v4/);
  assert.match(orchestrator,/channel-identity-hard-gate-v3/);
  assert.match(orchestrator,/INSTAGRAM_MEDIA_REQUIRED/);
  assert.match(orchestrator,/instagram_company/);
  assert.match(orchestrator,/Mira|mira/);
  assert.doesNotMatch(orchestrator,/\.insert\([^;]+\)\.catch\(/s);
});

test('Instagram is executable only with verified Mira media evidence',()=>{
  assert.ok(orchestrator);
  assert.match(orchestrator,/validInstagramSource|validInstagramMedia/);
  assert.match(orchestrator,/asset_url|assetUrl/);
  assert.match(orchestrator,/media_kind|mediaKind/);
  assert.match(orchestrator,/https:\/\//);
  assert.match(orchestrator,/verified/);
});

test('social publisher retains LinkedIn identity gates and adds fail-closed Instagram Buffer assets',()=>{
  assert.ok(publisher,'deployed publisher must be source controlled');
  assert.match(publisher,/6a70381699afb44349f0fb35/);
  assert.match(publisher,/6a70381699afb44349f0fb36/);
  assert.match(publisher,/6a70384d99afb44349f0fba9/);
  assert.match(publisher,/instagram_company/);
  assert.match(publisher,/INSTAGRAM_MEDIA_REQUIRED/);
  assert.match(publisher,/Mira|mira/);
  assert.match(publisher,/assets/);
  assert.match(publisher,/image:\s*\{\s*url/);
  assert.match(publisher,/video:\s*\{\s*url/);
  assert.match(publisher,/provider_immediate_readback/);
  assert.match(publisher,/arthur-personal-linkedin-identity-v4/);
});

test('known Instagram company identity is exact and no parallel scheduler/store is introduced',()=>{
  assert.match(publisher,/6a70384d99afb44349f0fba9/);
  assert.doesNotMatch(migration,/cron\.schedule/i);
  assert.doesNotMatch(migration,/create\s+table/i);
});
