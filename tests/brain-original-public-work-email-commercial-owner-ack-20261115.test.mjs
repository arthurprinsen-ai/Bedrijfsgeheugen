import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261115103000_original_public_work_email_commercial_safe_review_ack_v1.sql',import.meta.url),'utf8');

test('same original commercial Heartbeat creates source-specific durable ONE BRAIN owner acknowledgement',()=>{
 assert.match(sql,/create or replace function public\.powerhouse_commercial_heartbeat_v1\(/i);
 assert.match(sql,/pg_try_advisory_xact_lock/);
 assert.match(sql,/public\.brain_create_obligation\(/);
 assert.match(sql,/'powerhouse-original-public-work-email-commercial-safe-review-v1'/);
 assert.match(sql,/'original-agent:commercial'/);
 assert.match(sql,/'heartbeat-source-review:'\|\|v_work_email_review_row\.source_event_id/);
 assert.match(sql,/':source:'\|\|v_work_email_review_row\.source_event_id/);
 assert.match(sql,/source_revision\|\|':'/);
 assert.match(sql,/v_work_email_owner_ack\.state='OPEN'/);
 assert.match(sql,/public\.brain_transition_obligation\(/);
 assert.match(sql,/'BLOCKED','original-agent:commercial'/);
 assert.match(sql,/'OWNER_ACCEPTED_SAFE_HOLD'/);
 assert.match(sql,/'VERIFY_SOURCE_DELIVERABILITY_LAWFUL_BASIS_AND_SUPPRESSIONS'/);
 assert.match(sql,/limit 25/);
});
test('independently joins #138 fulfilled identity, exact original action + source revision and quarantined candidate',()=>{
 assert.match(sql,/identity\.id::text=hb\.evidence->>'identity_graph_brain_obligation_id'/);
 assert.match(sql,/identity\.state='FULFILLED'/);
 assert.match(sql,/identity\.evidence->>'source_event_id'=hb\.evidence->>'original_source_event_id'/);
 assert.match(sql,/identity\.evidence->>'source_revision'=hb\.evidence->>'source_revision'/);
 assert.match(sql,/identity\.evidence->>'original_action_id'=hb\.evidence->>'original_research_action_id'/);
 assert.match(sql,/c\.extra#>>'\{public_work_email_candidate,research_action_id\}'=hb\.evidence->>'original_research_action_id'/);
 assert.match(sql,/c\.extra#>>'\{public_work_email_candidate,email_verification\}'='UNVERIFIED'/);
 assert.match(sql,/c\.extra#>>'\{public_work_email_candidate,send_authorized\}'='false'/);
 assert.match(sql,/c\.extra#>>'\{public_work_email_candidate,data_processing_state\}'='CANDIDATE_NOT_PROMOTED'/);
});
test('immutable not-sendable safety contract and no new cron, vendor or mailer',()=>{
 assert.match(sql,/'verification_state','UNVERIFIED'/);
 assert.match(sql,/'provider_send_authorized',false/);
 assert.match(sql,/'recipient_consent_inferred',false/);
 assert.match(sql,/'external_messages_sent',0/);
 assert.match(sql,/'canonical_email_written',false/);
 assert.match(sql,/'public_work_email_commercial_owner_acks_created',v_work_email_review_acks_created/);
 assert.match(sql,/'public_work_email_commercial_review_blocked_total',v_work_email_review_acks_blocked_total/);
 assert.match(sql,/revoke execute on function public\.powerhouse_commercial_heartbeat_v1\(timestamptz\)\s+from public, anon, authenticated/i);
 assert.match(sql,/grant execute on function public\.powerhouse_commercial_heartbeat_v1\(timestamptz\)\s+to service_role/i);
 assert.doesNotMatch(sql,/cron\.schedule\s*\(|GMAIL_SEND_EMAIL|HUNTER_EMAIL_FINDER|APOLLO_PEOPLE_ENRICHMENT|create table|create policy/i);
});
test('retains original commercial closure and provider/measurement gates',()=>{
 for(const name of [
 'powerhouse_one_commercial_decision_loop_v1',
 'powerhouse_reconcile_current_commercial_action_set_v2',
 'powerhouse_commercial_action_closure_watchdog_v1',
 'powerhouse_commercial_output_assurance_v1',
 'powerhouse_commercial_regression_gate_v1',
 'powerhouse_terminalize_action_outcome_lineage_v1'
 ]) assert.ok(sql.includes(name),'existing canonical gate required: '+name);
 assert.match(sql,/'contact_public_work_email_heartbeat_receipt'/);
 assert.match(sql,/'commercial_heartbeat'/);
 assert.match(sql,/'DEGRADED_SOURCE_RETRY_OPEN'/);
});
