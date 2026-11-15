import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261115094500_original_public_work_email_heartbeat_source_receipt_v1.sql',import.meta.url),'utf8');

test('existing canonical commercial Heartbeat creates exact source-bound #138 PROCESSED receipt',()=>{
 assert.match(sql,/create or replace function public\.powerhouse_commercial_heartbeat_v1\(/i);
 assert.match(sql,/'contact_public_work_email_heartbeat_receipt'/);
 assert.match(sql,/'ORIGINAL_PUBLIC_WORK_EMAIL_HEARTBEAT_SOURCE_RECEIPT_V1'/);
 assert.match(sql,/src\.event_type='contact_public_work_email_candidate'/);
 assert.match(sql,/src\.evidence->>'handoff_state'='IDENTITY_GRAPH_PROCESSED'/);
 assert.match(sql,/src\.context->>'consumer_result'='PROCESSED'/);
 assert.match(sql,/b\.id::text=src\.evidence->>'consumer_brain_obligation_id'/);
 assert.match(sql,/b\.state='FULFILLED'/);
 assert.match(sql,/b\.evidence->>'source_event_id'=src\.event_id::text/);
 assert.match(sql,/b\.evidence->>'source_revision'=src\.evidence->>'observed_at'/);
 assert.match(sql,/c\.extra#>>'\{public_work_email_candidate,research_action_id\}'=src\.context->>'correlation_id'/);
 assert.match(sql,/original_research_action_id/);
 assert.match(sql,/identity_graph_brain_obligation_id/);
});
test('original source receipt is one per event and persists across days',()=>{
 assert.match(sql,/'contact-public-work-email-heartbeat:'\|\|src\.event_id::text/);
 assert.match(sql,/and not exists\([\s\S]*receipt\.dedupe_key='contact-public-work-email-heartbeat:'\|\|src\.event_id::text/);
 assert.match(sql,/order by src\.occurred_at,src\.event_id\s+limit 25\s+on conflict\(dedupe_key\) do nothing/i);
 assert.doesNotMatch(sql,/src\.occurred_at\s*>\s*p_now\s*-/i,'no historical source candidate silently expires');
 assert.match(sql,/v_email_receipts_written/);
 assert.match(sql,/public_work_email_source_heartbeat_receipts_total/);
 assert.match(sql,/public_work_email_unreadable_source_retry_backlog/);
});
test('candidate remains quarantined from email promotion, consent or provider sends',()=>{
 assert.match(sql,/src\.evidence->>'canonical_email_written'='false'/);
 assert.match(sql,/src\.evidence->>'provider_send_authorized'='false'/);
 assert.match(sql,/c\.extra#>>'\{public_work_email_candidate,email_verification\}'='UNVERIFIED'/);
 assert.match(sql,/c\.extra#>>'\{public_work_email_candidate,send_authorized\}'='false'/);
 assert.match(sql,/c\.extra#>>'\{public_work_email_candidate,data_processing_state\}'='CANDIDATE_NOT_PROMOTED'/);
 assert.match(sql,/'VERIFICATION_REQUIRED_NOT_SENDABLE'/);
 assert.match(sql,/'recipient_consent_inferred',false/);
 assert.match(sql,/'external_messages_sent',0/);
 assert.match(sql,/'next_owner','original-agent:commercial'/);
 assert.match(sql,/\$function\$;\s*-- Same pre-existing production ACL[\s\S]*revoke execute on function public\.powerhouse_commercial_heartbeat_v1\(timestamptz\)/i);
 assert.match(sql,/revoke execute on function public\.powerhouse_commercial_heartbeat_v1\(timestamptz\)\s+from public, anon, authenticated;/i);
 assert.match(sql,/grant execute on function public\.powerhouse_commercial_heartbeat_v1\(timestamptz\)\s+to service_role;/i);
 assert.doesNotMatch(sql,/cron\.schedule\s*\(|GMAIL_SEND_EMAIL|APOLLO_PEOPLE_ENRICHMENT|HUNTER_EMAIL_FINDER/i);
});
test('all existing commercial terminal/outcome, provider and regression gates survive',()=>{
 for(const name of [
 'powerhouse_one_commercial_decision_loop_v1',
 'powerhouse_reconcile_current_commercial_action_set_v2',
 'powerhouse_commercial_action_closure_watchdog_v1',
 'powerhouse_commercial_output_assurance_v1',
 'powerhouse_commercial_regression_gate_v1',
 'powerhouse_dispatch_human_sales_composer_v2',
 'powerhouse_terminalize_action_outcome_lineage_v1'
 ]) assert.ok(sql.includes(name),'must preserve original step: '+name);
 assert.match(sql,/'commercial_heartbeat'/);
 assert.match(sql,/'commercial_day_proven',v_proven/);
});
