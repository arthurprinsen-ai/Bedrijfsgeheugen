import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261118174500_original_provider_owner_notification_receipt_v3.sql',import.meta.url),'utf8');
test('reuses original #171 guardian, no new scheduler, sender or table',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_original_result_guardian_v1\(\)/);
 assert.match(sql,/NEW\.onderdeel IS DISTINCT FROM 'powerhouse-email-executor'/);
 assert.match(sql,/pg_try_advisory_xact_lock/);
 assert.doesNotMatch(sql,/cron\.schedule\s*\(|net\.http_post\s*\(|CREATE\s+TRIGGER|CREATE\s+TABLE/i);
});
test('original provider HTTP and personal 429—not paid status—drive owner action',()=>{
 assert.match(sql,/r\.content LIKE '%TAVILY_432%'/);
 assert.match(sql,/r\.status_code=500/);
 assert.match(sql,/artifact_generation_failure,classification/);
 assert.match(sql,/PROVIDER_BILLING/);
 assert.match(sql,/insufficient_quota/);
 assert.match(sql,/paid_or_unpaid_independently_verified',false/);
});
test('original Brain event is deduped; only provider delivery proves notification',()=>{
 assert.match(sql,/owner_action_due/);
 assert.match(sql,/original-owner-action:/);
 assert.match(sql,/ON CONFLICT \(dedupe_key\) DO NOTHING/);
 assert.match(sql,/NOT_SENT_BY_GUARDIAN/);
 assert.match(sql,/PENDING_VERIFIED_OWNER_NOTIFICATION/);
 assert.doesNotMatch(sql,/notification_sent',true|provider_send_attempted',true/);
});
test('original email source/duplicate safety, service only and red state remain',()=>{
 assert.match(sql,/SOURCE_SPECIFIC_EVIDENCE_REQUIRED/);
 assert.match(sql,/AND NOT v_news_plan_limit_hit/);
 assert.match(sql,/provider_uncertain_no_resend/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_original_result_guardian_v1\(\)\s+FROM PUBLIC, anon, authenticated/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_original_result_guardian_v1\(\)\s+TO service_role/);
 assert.match(sql,/NEW\.status := 'fout'/);
});
