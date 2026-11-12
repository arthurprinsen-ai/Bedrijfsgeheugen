import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sql=fs.readFileSync(new URL('../supabase/migrations/20261112173000_original_daily_source_brain_heartbeat_v1.sql',import.meta.url),'utf8');

test('one ORIGINAL #175 archives every daily growth intelligence class in the existing source store',()=>{
  for(const cls of [
    'dataforseo_provider_activity','seo_keyword_provider','external_intelligence',
    'website_page_cro','blog_publication','ai_content_recommendations','technical_seo_audit'
  ]) assert.ok(sql.includes("'"+cls+"'"),'missing '+cls);
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_daily_source_archive_v1\(p_day date\)/);
  assert.match(sql,/INSERT INTO public\.powerhouse_growth_source_daily_v1/);
  assert.match(sql,/ON CONFLICT\(tenant_id,metric_date,source_key\) DO UPDATE/);
  assert.match(sql,/powerhouse_capture_growth_source_daily_v1/);
  assert.match(sql,/v_multisource:=public\.powerhouse_daily_source_archive_v1\(p_day\)/);
  assert.match(sql,/PROVIDER_DIAGNOSTIC_ONLY/);
  assert.match(sql,/MISSING_PROVIDER_KEYWORDS/);
  assert.match(sql,/MISSING_INDEPENDENT_TECHNICAL_AUDIT_PROOF/);
  assert.match(sql,/PUBLICATION_UNVERIFIED/);
  assert.match(sql,/recommendation_not_execution_or_ai_model_validation/);
  assert.match(sql,/low_sample_does_not_prove_causal_failure/);
});
test('SHA256 source manifest enters ONE BRAIN and actual #140 consumer independently re-reads the exact source',()=>{
  assert.match(sql,/INSERT INTO public\.brain_obligations/);
  assert.match(sql,/GROWTH_SOURCE_DAILY_HANDOFF/);
  assert.match(sql,/SOURCE_PERSISTED_AWAIT_ORIGINAL_BRAIN_READBACK/);
  assert.match(sql,/encode\(sha256\(convert_to\(v_manifest::text,'UTF8'\)\),'hex'\)/);
  assert.match(sql,/v_hash=v_brain\.payload_sha256/);
  assert.match(sql,/v_brain\.evidence->>'source_revision'=v_hash/);
  assert.match(sql,/v_accepted:=v_brain\.id IS NOT NULL/);
  assert.match(sql,/public\.powerhouse_daily_source_consume_v1\(v_date-v_source_offset\)/);
  assert.match(sql,/ORIGINAL_BRAIN_INPUT_ACCEPTED_WAIT_CRO_OUTCOME/);
  assert.match(sql,/SOURCE_REVISION_MISMATCH_RETRY/);
  assert.match(sql,/actual_cro_experiment_executed',false/);
  assert.match(sql,/causal_lift_or_revenue_proven',false/);
  assert.doesNotMatch(sql,/state='FULFILLED'/i);
});
test('Heartbeat reads the original source consumer; original provider dispatch & jobs are not duplicated',()=>{
  assert.match(sql,/original_daily_growth_source_producer/);
  assert.match(sql,/original_daily_growth_source_consumer/);
  assert.match(sql,/daily_source_brain_ack_verified/);
  assert.match(sql,/powerhouse_commercial_intelligence_heartbeat_v1\(v_date\)/);
  assert.match(sql,/PROPOSE_REVERSIBLE_CTA_VISIBILITY_VALUE_PROP_AB_TEST/);
  assert.match(sql,/PROPOSE_REVERSIBLE_CONTACT_FORM_FRICTION_AB_TEST/);
  assert.match(sql,/powerhouse_content_closed_loop_tick_v1/);
  assert.doesNotMatch(sql,/cron\.schedule|CREATE TRIGGER|CREATE TABLE/i);
  assert.equal((sql.match(/net\.http_post\(/g)||[]).length,1,'retain only original content-loop provider call');
  for(const signature of [
    'powerhouse_daily_source_archive_v1(date)',
    'powerhouse_daily_source_consume_v1(date)',
    'powerhouse_capture_growth_source_daily_v1(date)',
    'powerhouse_content_closed_loop_tick_v1(timestamptz)',
    'powerhouse_commercial_intelligence_heartbeat_v1(date)'
  ]) {
    assert.ok(sql.includes('REVOKE ALL ON FUNCTION public.'+signature),'private grant '+signature);
    assert.ok(sql.includes('GRANT EXECUTE ON FUNCTION public.'+signature+' TO service_role'),'service role grant '+signature);
  }
});
