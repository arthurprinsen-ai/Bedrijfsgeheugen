import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261114101000_original_research_consumer_handoff_receipts_v1.sql',import.meta.url),'utf8');

test('original #116 stage 2/3 alone owns durable per-action handoff receipts, not a second scheduler',()=>{
 assert.match(sql,/create or replace function public\.powerhouse_reconcile_relationship_research_handoff_v1/);
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_commercial_hourly_stage_v1/);
 assert.match(sql,/if p_stage in \(2,3\) then\s+v_handoff := public\.powerhouse_reconcile_relationship_research_handoff_v1\(p_run_date\)/);
 assert.match(sql,/commercial-stage:/);
 assert.match(sql,/original-research-owner-handoff:/);
 assert.match(sql,/on conflict\(dedupe_key\) do update set/);
 assert.doesNotMatch(sql,/\bcron\.schedule\s*\(|\bcreate\s+table\b/i);
});
test('research provider attempt and downstream consumer receipt are separate exact owner proofs',()=>{
 assert.match(sql,/public_research_execution,provider/);
 assert.match(sql,/dataforseo-serp/);
 assert.match(sql,/public_research_execution,researched_at/);
 assert.match(sql,/relationship_source_candidate,research_action_id/);
 assert.match(sql,/relationship_source_candidate,original_outreach_action_id/);
 assert.match(sql,/o\.person_key=t\.person_key/);
 assert.match(sql,/o\.company_key=t\.company_key/);
 assert.match(sql,/original_consumer_receipt/);
 assert.match(sql,/ORIGINAL_COMPOSER_RECEIVED_UNVERIFIED_CANDIDATE/);
 assert.match(sql,/ORIGINAL_CONSUMER_CANDIDATE_ACK_MISSING/);
 assert.match(sql,/ORIGINAL_RECIPIENT_ACTION_NOT_FOUND/);
});
test('overdue provider receipts cannot silently appear actioned or green',()=>{
 assert.match(sql,/PROVIDER_RECEIPT_OVERDUE/);
 assert.match(sql,/interval '2 hours'/);
 assert.match(sql,/when v_bad then 'error'/);
 assert.match(sql,/coalesce\(\(v_handoff->>'overdue'\)::int,0\)>0/);
 assert.match(sql,/research_handoff_receipt/);
 assert.match(sql,/provider_dispatched/);
 assert.match(sql,/original_provider_request_id/);
});
test('queued HTTP request and source snippet never count as sent Gmail or permission',()=>{
 assert.match(sql,/'original_email_send_executed',false/);
 assert.match(sql,/'gmail_provider_delivery_proven',false/);
 assert.match(sql,/'recipient_send_authority_inferred',false/);
 assert.match(sql,/SOURCE_CANDIDATE_NOT_MESSAGE_AUTHORITY/);
 assert.match(sql,/UNVERIFIED_SOURCE_CANDIDATE_ONLY/);
 assert.match(sql,/ORIGINAL_TERMINAL_NO_RESEND/);
 assert.match(sql,/external_send_executed',false/);
});
test('the original research stage never triggers early 24h provider retries',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_dispatch_relationship_public_research_v1/);
 assert.match(sql,/and \(due_at is null or due_at<=now\(\)\)/);
 assert.match(sql,/'NO_DUE_RESEARCH','pending',0/);
 assert.match(sql,/research_owner','powerhouse-relationship-public-research/);
});
test('the privileged reconciler remains service-only and bounded in time',()=>{
 assert.match(sql,/security definer/);
 assert.match(sql,/revoke all on function public\.powerhouse_reconcile_relationship_research_handoff_v1\(date\)\s+from public,anon,authenticated/);
 assert.match(sql,/grant execute on function public\.powerhouse_reconcile_relationship_research_handoff_v1\(date\)\s+to service_role/);
 assert.match(sql,/interval '10 days'/);
 assert.match(sql,/limit 250/);
 assert.match(sql,/pg_try_advisory_xact_lock/);
});
