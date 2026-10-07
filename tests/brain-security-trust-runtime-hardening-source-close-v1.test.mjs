import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(p,'utf8');

test('exact production security hardening migrations are source closed',async()=>{
 const [a,b,c]=await Promise.all([
  read('supabase/migrations/20261007163124_security_trust_harden_helper_search_path_v1.sql'),
  read('supabase/migrations/20261007163230_security_trust_remove_browser_definer_exposure_v1.sql'),
  read('supabase/migrations/20261007163333_security_trust_posture_precision_v1.sql')
 ]);
 assert.match(a,/set search_path = pg_catalog, public/);
 assert.match(b,/security_invoker = true/);
 assert.match(b,/revoke all on table public\.powerhouse_predictive_commercial_brief_cache_v1 from anon, authenticated/);
 assert.match(c,/browserReadableDefinerViews/);
 assert.match(c,/privilegedRpcReviewCount/);
 assert.match(c,/database_catalog_observed_browser_exposure_only/);
});

test('security trust source close learning is semantic and fail closed',async()=>{
 const raw=await read('brain/learning/2026-10-07-security-trust-runtime-hardening-source-close-v1.json');
 const learning=JSON.parse(raw);
 assert.equal(learning.compiler.failure_class,'SECURITY_TRUST_RUNTIME_SOURCE_DRIFT');
 assert.ok(learning.evaluation.historical_replay.length>0);
 assert.ok(learning.evaluation.shadow.length>0);
 assert.ok(learning.evaluation.canary.length>0);
 assert.ok(learning.evidence.production_migrations.length===3);
});
