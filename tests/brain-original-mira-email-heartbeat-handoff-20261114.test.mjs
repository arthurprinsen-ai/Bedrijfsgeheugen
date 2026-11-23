import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../supabase/migrations/20261114161000_original_daily_mira_email_heartbeat_handoff_v1.sql',import.meta.url),'utf8');

test('one ORIGINAL #140 Heartbeat (not a second publisher or scheduler) owns the receipt',()=>{
 assert.match(source,/CREATE OR REPLACE FUNCTION public\.powerhouse_commercial_intelligence_heartbeat_v1\(p_run_date date/);
 assert.match(source,/original_daily_mira_email_handoff',v_daily_delivery_receipt/);
 assert.equal((source.match(/'original_daily_mira_email_handoff',v_daily_delivery_receipt/g)||[]).length,2);
 assert.match(source,/ORIGINAL_DAILY_MIRA_EMAIL_TO_HEARTBEAT_ACK_V1/);
 assert.match(source,/original-commercial-intelligence-heartbeat-140/);
 assert.match(source,/original content handoff cron 171/);
 assert.match(source,/original commercial cron 116/);
 assert.doesNotMatch(source,/cron\.schedule\s*\(|net\.http_post\s*\(|\bGMAIL_SEND_EMAIL\b|\bCREATE\s+TABLE\b/i);
});
test('Instagram requires exact original source revision, ONE BRAIN and provider truth; source-only never passed as posted',()=>{
 assert.match(source,/content_publication_obligations o/);
 assert.match(source,/o\.tenant_id='canonical' and o\.channel='instagram'/);
 assert.match(source,/to_char\(o\.updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS\.US"Z"'\)/);
 assert.match(source,/b\.obligation_type='CONTENT_HANDOFF'/);
 assert.match(source,/b\.capability_id='content:instagram'/);
 assert.match(source,/v_ig_ack_revision=v_ig_source_revision/);
 assert.match(source,/v_ig_status in \('LIVE_PROVEN','MEASURED','LEARNED'\)/);
 assert.match(source,/v_ig_live_at is not null/);
 assert.match(source,/original_ig\.evidence->>'provider_truth_verified'='true'/);
 assert.match(source,/when v_ig_lineage=0 then 'MIRA_SOURCE_SELECTION_TO_LINEAGE_MISSING'/);
 assert.match(source,/when v_ig_media_jobs=0 then 'MIRA_ORIGINAL_MEDIA_JOB_MISSING'/);
 assert.match(source,/'provider_media_credit_scope_not_inferred',true/);
});
test('Gmail daily sends require original action and independently verified exact provider identity',()=>{
 assert.match(source,/a\.action_type='autonomous_email' and a\.channel='email'/);
 assert.match(source,/\(a\.executed_at at time zone 'Europe\/Amsterdam'\)::date=p_run_date/);
 assert.match(source,/a\.status='done'/);
 assert.match(source,/autonomous_outbound,provider_message_id/);
 assert.match(source,/autonomous_outbound,provider_ack_verified/);
 assert.match(source,/autonomous_outbound,provider_readback_verified/);
 assert.match(source,/autonomous_outbound,user_authorized/);
 assert.match(source,/autonomous_outbound,needs_readback/);
 assert.match(source,/'provider_verified_sends_today',v_gmail_sends/);
});
test('NO_SOURCE is only an exact held consumer ACK, never a sender trigger',()=>{
 assert.match(source,/r\.dedupe_key='relationship-research:outreach-source:'\|\|a\.action_id::text/);
 assert.match(source,/r\.person_key=a\.person_key and r\.company_key=a\.company_key/);
 assert.match(source,/owner_ack\.dedupe_key='original-research-owner-handoff:'\|\|r\.action_id::text/);
 assert.match(source,/consumer_no_source_disposition_received/);
 assert.match(source,/relationship_research_feedback,source_status.*NO_VERIFIED_SOURCE_RETRY/);
 assert.match(source,/\(a\.created_at at time zone 'Europe\/Amsterdam'\)::date=p_run_date/);
 assert.match(source,/'WAIT_VERIFIED_COMPANY_SOURCE_AND_ORIGINAL_COMPOSER'/);
 assert.match(source,/'recipient_authority_not_inferred',true/);
 assert.match(source,/'no_duplicate_gmail_send',true/);
});
test('existing SEO original CRO snapshot contract is retained, no false daily green, ACL stays service only',()=>{
 assert.match(source,/ORIGINAL_SEO_TO_HEARTBEAT_CRO_RECEIPT_V1/);
 assert.match(source,/commercial_intelligence_heartbeat/);
 assert.match(source,/daily_source_brain_ack_verified/);
 assert.match(source,/case\s+when v_ig_proven and v_gmail_sends>0 then 'BOTH_PROVIDER_DELIVERIES_PROVEN'/);
 assert.match(source,/'OPEN_ORIGINAL_OWNERS_WAITING'/);
 assert.match(source,/'OPEN_ORIGINAL_OWNERS_OVERDUE'/);
 assert.match(source,/'learning_or_revenue_proven',false/);
 assert.match(source,/REVOKE ALL ON FUNCTION public\.powerhouse_commercial_intelligence_heartbeat_v1\(date\) FROM PUBLIC, anon, authenticated/);
 assert.match(source,/GRANT EXECUTE ON FUNCTION public\.powerhouse_commercial_intelligence_heartbeat_v1\(date\) TO service_role/);
});
