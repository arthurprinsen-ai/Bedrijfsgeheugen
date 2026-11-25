import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const filename='supabase/migrations/20261110131500_original_commercial_nested_gmail_provider_outcome_assurance_v1.sql';
const sql=readFileSync(new URL('../'+filename,import.meta.url),'utf8');

test('one existing daily Brain function, no parallel executor, queue, provider call or backfill',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_commercial_output_assurance_v1\(p_run_date date/);
  assert.equal((sql.match(/CREATE OR REPLACE FUNCTION/gi)||[]).length,1);
  assert.match(sql,/\$function\$;/); // Postgres migration statement must be terminated
  assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|GMAIL_SEND_EMAIL|GMAIL_FETCH_MESSAGE|update public\.powerhouse_sales_actions|insert into public\.powerhouse_sales_outcomes/i);
  assert.match(sql,/insert into public\.brain_obligations\(/);
  assert.match(sql,/on conflict \(obligation_type,capability_id,business_entity,business_period,business_timezone\)/);
  assert.match(sql,/on conflict/);
});

test('native sender count requires exact independent sent outcome, never provider ID or done alone',()=>{
  for(const clause of [
    "a.action_type='autonomous_email'",
    "a.evidence#>>'{autonomous_outbound,provider}'='composio-gmail'",
    "a.evidence#>>'{autonomous_outbound,provider_ack_verified}'='true'",
    "a.evidence#>>'{autonomous_outbound,provider_readback_verified}'='true'",
    "a.evidence#>>'{autonomous_outbound,republish_forbidden}'='true'",
    "o.action_id=a.action_id",
    "o.dedupe_key='autonomous-email-sent:'||a.action_id::text",
    "o.outcome_type='sent'",
    "o.person_key=a.person_key",
    "o.company_key=a.company_key",
    "o.evidence->>'provider_readback_verified'='true'",
    "o.evidence->>'provider_message_id'=a.evidence#>>'{autonomous_outbound,provider_message_id}'",
    "o.evidence->>'provider_thread_id'=a.evidence#>>'{autonomous_outbound,provider_thread_id}'"
  ])assert.ok(sql.includes(clause),'missing independent proof gate '+clause);
  assert.match(sql,/and exists \(\s*select 1 from public\.powerhouse_sales_outcomes o/);
  assert.match(sql,/and \(a\.executed_at at time zone 'Europe\/Amsterdam'\)::date=p_run_date/);
});

test('legacy top-level proof is preserved and no second copy of Gmail count may inflate daily metrics',()=>{
  assert.match(sql,/coalesce\(a\.evidence->>'provider_ack_verified','false'\)='true'/);
  assert.match(sql,/coalesce\(a\.evidence->>'provider_readback_verified','false'\)='true'/);
  assert.ok(sql.includes("and nullif(btrim(coalesce(a.evidence->>'provider_message_id','')),'') is not null"));
  assert.match(sql,/v_email := jsonb_array_length\(v_email_proofs\);/);
  assert.match(sql,/v_proofs := v_email_proofs \|\| v_proofs \|\| v_dm_proofs \|\| v_publication_proofs;/);
  assert.equal((sql.match(/into v_email_proofs/g)||[]).length,1);
  assert.equal((sql.match(/into v_email/g)||[]).length,1); // substring of into v_email_proofs only
  assert.match(sql,/'provider_proven_email',v_email/);
  assert.match(sql,/'provider_proof',v_proofs/);
});

test('original social, SalesRobot, publication, safe non-send and daily owner remain untouched',()=>{
  for(const clause of [
    "a.action_type='salesrobot_linkedin_dm'",
    "e.event_type='salesrobot_linkedin_dm_sent'",
    "e.evidence->>'provider_inbox_readback'='true'",
    "p.channel='linkedin_company'",
    "p.channel='instagram'",
    "p.status in ('LIVE_PROVEN','MEASURED','LEARNED')",
    "daily-commercial-provider-proof-v1",
    "'Powerhouse Growth & Revenue OS'",
    "v_safe_no_send := v_set>0 and v_decisions=v_set",
    "'daily_commercial_execution_sla','MET_ONLY_WITH_PROVIDER_PROOF'"
  ])assert.ok(sql.includes(clause),'lost original authority '+clause);
});
