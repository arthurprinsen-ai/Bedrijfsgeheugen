import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync('supabase/migrations/20261117192500_original_cro_consumer_source_diagnostics_v1.sql','utf8');
test('same original #140 consumer, no new scheduler or provider writer',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_daily_source_consume_v1/);
 assert.match(sql,/CRO_CONSUMER_ORIGINAL_SOURCE_CHANGED_REVIEW_REQUIRED/);
 assert.doesNotMatch(sql,/cron\.schedule|cron\.alter_job|CREATE TABLE|CREATE TRIGGER|http_post|net\.http/i);
});
test('readback of all three existing views with no PII or false conversion',()=>{
 for(const key of ['powerhouse_cro_site_signal_v1','powerhouse_cro_post_signal_v1','powerhouse_cro_email_signal_v1','verified_send_readbacks_7d','low_consented_sample_pages','cta_mapping_gap_pages','SOURCE_DIAGNOSTICS_READBACK','SOURCE_READBACK_UNVERIFIED','effect_verified', 'next_safe_action']) assert.ok(sql.includes(key),key);
 for(const secret of ['sender_email','recipient_email','reply_text','service_role_key'])assert.ok(!sql.includes(secret),secret);
});
test('original immutable source ACK not replaced and diagnostic consumer rechecks hourly',()=>{
 for(const key of ['SOURCE_REVISION_MISMATCH_OR_PRODUCER_MISSING_RETRY_ORIGINAL_175','consumer_ack','ORIGINAL_BRAIN_INPUT_ACCEPTED_WAIT_CRO_OUTCOME','checked_hour_utc','actual_cro_experiment_executed','causal_lift_or_revenue_proven'])assert.ok(sql.includes(key),key);
 assert.match(sql,/v_cro_state='SOURCE_DIAGNOSTICS_READBACK'/);
});
