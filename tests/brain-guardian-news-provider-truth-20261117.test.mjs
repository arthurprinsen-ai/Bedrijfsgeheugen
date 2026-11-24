import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261117110000_original_guardian_news_source_provider_truth_v2.sql',import.meta.url),'utf8');

test('reuses ONLY canonical #171 guardian with original #20 news source; no new scheduler',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_original_result_guardian_v1\(\)/i);
 assert.match(sql,/FROM cron\.job_run_details WHERE jobid=20 AND status='succeeded'/i);
 assert.match(sql,/NEW\.onderdeel IS DISTINCT FROM 'powerhouse-email-executor'/i);
 assert.match(sql,/powerhouse_prepare_connection_email_activation_v1\(v_day,1\)/);
 assert.doesNotMatch(sql,/cron\.schedule\s*\(|net\.http_post\s*\(|create\s+table|create\s+trigger/i);
});

test('provider plan-limit is determined from original actual HTTP 500 not green cron',()=>{
 assert.match(sql,/FROM net\._http_response r/i);
 assert.match(sql,/r\.status_code=500/i);
 assert.match(sql,/r\.content LIKE '%TAVILY_432%'/);
 assert.match(sql,/TAVILY_PLAN_LIMIT_EXCEEDED/);
 assert.match(sql,/v_news_plan_limit_hit OR v_news_stale OR v_held>0/);
 assert.match(sql,/news_source_failure_independently_observed/);
});

test('stale news is explicitly separate from verified plan-limit and provider delivery',()=>{
 assert.match(sql,/max\(opgehaald_op\) INTO v_news_last_ingest/);
 assert.match(sql,/v_news_last_provider_ok<v_now-interval '72 hours'/);
 assert.match(sql,/PROVIDER_NEWS_INGEST_STALE/);
 assert.match(sql,/NO_NEW_SOURCE_FAILURE_OBSERVED/);
 assert.match(sql,/'provider_send_attempted',false/);
 assert.match(sql,/'release_green_proven',false/);
});

test('avoid generating unsupported outreach or spending quota-restricted provider credits',()=>{
 assert.match(sql,/AND NOT v_news_plan_limit_hit/);
 assert.match(sql,/'news_quota_no_redundant_retry',v_news_plan_limit_hit/);
 assert.match(sql,/v_today_candidates<5/);
 assert.match(sql,/pg_try_advisory_xact_lock/);
 assert.match(sql,/ON CONFLICT \(dedupe_key\) DO NOTHING/i);
 assert.doesNotMatch(sql,/UPDATE\s+public\.bg_connecties|provider_ack_verified.*true|status\s*=\s*'done'/i);
});

test('fail-closed health of original guardian is preserved and browser roles unchanged',()=>{
 assert.match(sql,/SECURITY DEFINER/i);
 assert.match(sql,/NEW\.status := 'fout'/);
 assert.match(sql,/EXCEPTION WHEN OTHERS THEN/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_original_result_guardian_v1\(\)\s+FROM PUBLIC, anon, authenticated/i);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_original_result_guardian_v1\(\)\s+TO service_role/i);
});
