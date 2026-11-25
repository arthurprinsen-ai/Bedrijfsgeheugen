import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261118184000_original_guardian_provider_scope_source_freshness_v4.sql',import.meta.url),'utf8');
test('retains original #171 and #20 result guardian, no new providers or writers',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_original_result_guardian_v1\(\)/);
 assert.match(sql,/WHERE r\.created >= v_now-interval '36 hours'/);
 assert.match(sql,/pg_try_advisory_xact_lock/);
 assert.doesNotMatch(sql,/cron\.schedule\s*\(|net\.http_post\s*\(|CREATE\s+TABLE|CREATE\s+TRIGGER|api\.tavily\.com|api\.openai\.com/i);
});
test('later news is separately counted without falsely proving Tavily recovery',()=>{
 assert.match(sql,/v_news_last_432_at/);
 assert.match(sql,/max\(r\.created\) INTO v_news_last_432_at/);
 assert.match(sql,/count\(\*\) FILTER/);
 assert.match(sql,/zekerheid >= 0\.8/);
 assert.match(sql,/news_source_ingests_after_last_432/);
 assert.match(sql,/news_ingestion_not_sufficient_for_original_tavily_recovery',true/);
 assert.match(sql,/original_provider_recovery_verified',false/);
 assert.doesNotMatch(sql,/Geen nieuwe geverifieerde bedrijfsnieuwsbron/);
});
test('OpenAI personal 429 historic and same original cooldown preserved',()=>{
 assert.match(sql,/artifact_generation_failure,last_failed_at/);
 assert.match(sql,/openai_personal_last_429_at/);
 assert.match(sql,/original_personal_generator_recovery_verified',false/);
 assert.match(sql,/retry_after',v_openai_retry_after/);
 assert.match(sql,/notification_sent',false/);
 assert.match(sql,/NOT_SENT_BY_GUARDIAN/);
});
test('source/lawfulness original email and service-only fences persist',()=>{
 assert.match(sql,/SOURCE_SPECIFIC_EVIDENCE_REQUIRED/);
 assert.match(sql,/AND NOT v_news_plan_limit_hit/);
 assert.match(sql,/provider_uncertain_no_resend/);
 assert.match(sql,/NEW\.status := 'fout'/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_original_result_guardian_v1\(\)\s+FROM PUBLIC, anon, authenticated/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_original_result_guardian_v1\(\)\s+TO service_role/);
});
