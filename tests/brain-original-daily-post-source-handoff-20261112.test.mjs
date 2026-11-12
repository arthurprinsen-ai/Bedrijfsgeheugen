import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sql=fs.readFileSync(new URL('../supabase/migrations/20261112184500_original_daily_post_publication_metric_ack_v1.sql',import.meta.url),'utf8');

test('original #175 stores a post source across BOTH exact original owners without another publisher',()=>{
 assert.match(sql,/SELECT 'posts_publication_and_metrics'/);
 assert.match(sql,/tenant_id in\('canonical','bedrijfsgeheugen'\)/);
 assert.match(sql,/channel_kind in\('linkedin_company','linkedin_personal','instagram'\)/);
 assert.match(sql,/publication_date=p_day/);
 assert.match(sql,/v_saved<>8/);
 assert.match(sql,/source_revision',md5\(/);
 assert.match(sql,/provider_id_plus_original_live_readback_required',true/);
 assert.match(sql,/numeric_metric_must_have_provider_linked_proof|data_quality='PROVIDER_OBSERVED_LINKED'/);
 assert.match(sql,/s\.observed_at>=p\.published_at/);
 assert.match(sql,/observed_at_not_historical_window',true/);
 assert.match(sql,/MISSING_POST_METRICS/);
 assert.match(sql,/PARTIAL_POST_METRICS/);
 assert.match(sql,/PUBLICATION_UNVERIFIED/);
 assert.doesNotMatch(sql,/cron\.schedule|CREATE TRIGGER|CREATE TABLE|http_post\(/i);
});
test('ONE BRAIN original #140 re-reads post data through same SHA source manifest',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_daily_source_consume_v1\(p_day date\)/);
 assert.match(sql,/source_key='posts_publication_and_metrics'/);
 assert.match(sql,/v_hash=v_brain\.payload_sha256/);
 assert.match(sql,/v_brain\.evidence->>'source_revision'=v_hash/);
 assert.match(sql,/original_post_obligations',v_posts_total/);
 assert.match(sql,/provider_live_posts',v_posts_live/);
 assert.match(sql,/posts_with_verified_numeric_metrics',v_posts_numeric/);
 assert.match(sql,/COLLECT_SOURCE_LINKED_PROVIDER_POST_METRICS/);
 assert.match(sql,/PROPOSE_REVERSIBLE_POST_HOOK_CTA_HOLDOUT_TEST/);
 assert.match(sql,/actual_cro_experiment_executed',false/);
 assert.match(sql,/causal_lift_or_revenue_proven',false/);
 assert.doesNotMatch(sql,/state='FULFILLED'/);
});
test('existing source functions stay private; publisher is unchanged',()=>{
 for(const name of ['powerhouse_daily_source_archive_v1','powerhouse_daily_source_consume_v1']){
  assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.'+name+'(date) FROM PUBLIC,anon,authenticated'));
  assert.ok(sql.includes('GRANT EXECUTE ON FUNCTION public.'+name+'(date) TO service_role'));
 }
 assert.match(sql,/SECURITY DEFINER/);
 assert.equal((sql.match(/CREATE OR REPLACE FUNCTION/g)||[]).length,2,'existing original two functions only');
 assert.match(sql,/SET search_path TO 'pg_catalog', 'public'|SET search_path TO 'pg_catalog','public'/);
});
