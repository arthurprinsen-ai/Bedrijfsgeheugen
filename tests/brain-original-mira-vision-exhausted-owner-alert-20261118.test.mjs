import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261118194000_original_guardian_mira_vision_exhausted_owner_notice_v5.sql',import.meta.url),'utf8');

test('one ORIGINAL #171 service-only trigger, not a parallel provider dispatcher',()=>{
 assert.equal((sql.match(/CREATE OR REPLACE FUNCTION public\.powerhouse_original_result_guardian_v1\(\)/g)||[]).length,1);
 assert.ok(sql.length<24000,'a safe single native function migration must not accidentally duplicate its source during string interpolation');
 assert.equal((sql.match(/v_state := CASE/g)||[]).length,1,'the original guardian must contain exactly one state reducer');
 assert.equal((sql.match(/IF v_mira_exhausted THEN/g)||[]).length,1,'a single exhausted vision owner action per original guarded event');
 assert.equal((sql.match(/v_state := CASE/g)||[]).length,1);
 assert.match(sql,/pg_try_advisory_xact_lock/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_original_result_guardian_v1\(\)\s+FROM PUBLIC, anon, authenticated/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_original_result_guardian_v1\(\)\s+TO service_role/);
 assert.doesNotMatch(sql,/net\.http_post\(|cron\.schedule\(|CREATE\s+TABLE|INSERT\s+INTO\s+public\.powerhouse_instagram_media_jobs_v1|UPDATE\s+public\.powerhouse_instagram_media_jobs_v1/i);
});
test('only original exact same-day 3/3 verifier exhaustion without Meta ID is actionable',()=>{
 assert.match(sql,/j\.tenant_id='canonical'/);
 assert.match(sql,/j\.publication_date=v_day/);
 assert.match(sql,/j\.channel='instagram'/);
 assert.match(sql,/j\.status='WAITING_PROOF'/);
 assert.match(sql,/j\.last_error='MIRA_FRAME_VISION_PROVIDER_UNAVAILABLE'/);
 assert.match(sql,/j\.asset_manifest->>'vision_resume_contract'='mira-original-exact-video-provider-retry-v1'/);
 assert.match(sql,/coalesce\(o\.external_id,''\)=''/);
 assert.match(sql,/o\.status IN \('FAILED','BLOCKED'\)/);
 assert.match(sql,/v_mira_vision_retries >= 3/);
 assert.match(sql,/v_mira_exhausted := v_mira_media_job_id IS NOT NULL/);
});
test('one durable original owner notice, no fourth call or false paid-account claim',()=>{
 assert.match(sql,/'fingerprint','mira-vision-verifier-3of3-original'/);
 assert.match(sql,/'max_automatic_verification_attempts',3/);
 assert.match(sql,/'exact_frame_identity_proven',false/);
 assert.match(sql,/'meta_provider_post_id',null/);
 assert.match(sql,/'notification_sent',false/);
 assert.match(sql,/'delivery_proof','NOT_SENT_BY_GUARDIAN'/);
 assert.match(sql,/ON CONFLICT \(dedupe_key\) DO NOTHING/);
 assert.match(sql,/'mira_original_media_verification_state',CASE WHEN v_mira_exhausted/);
 assert.match(sql,/v_mira_exhausted OR v_openai_quota/);
 assert.match(sql,/OR v_openai_quota OR v_mira_exhausted\)/);
 assert.doesNotMatch(sql,/Add credits to continue|OPENART_API_KEY|TAVILY_API_KEY/);
});
test('original commercial and paid-provider truth remains intact',()=>{
 assert.match(sql,/'fingerprint','tavily-432-original-news'/);
 assert.match(sql,/'fingerprint','openai-429-personal-original'/);
 assert.match(sql,/SOURCE_SPECIFIC_EVIDENCE_REQUIRED/);
 assert.match(sql,/news_source_ingests_after_last_432/);
 assert.match(sql,/PENDING_VERIFIED_OWNER_NOTIFICATION/);
 assert.match(sql,/v_owner_actions := v_owner_actions \|\| jsonb_build_array/);
 assert.equal((sql.match(/CREATE OR REPLACE FUNCTION/g)||[]).length,1);
});
