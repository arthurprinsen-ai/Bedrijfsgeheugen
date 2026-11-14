import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261114083500_original_approved_connection_source_priming_v1.sql',import.meta.url),'utf8');

test('uses existing commercial hourly stage and original source research without parallel scheduling',()=>{
  assert.match(sql,/perform public\.powerhouse_prime_approved_connection_research_v1\(p_run_date\)/);
  assert.match(sql,/create or replace function public\.powerhouse_execute_relationship_research_v1/i);
  assert.doesNotMatch(sql,/cron\.schedule\s*\(/i);
  assert.doesNotMatch(sql,/create\s+table/i);
});

test('source research is bounded to at most five each local calendar day with stable idempotency',()=>{
  assert.match(sql,/v_daily_cap integer := 5;/);
  assert.match(sql,/v_already >= v_daily_cap/);
  assert.match(sql,/limit greatest\(0,v_daily_cap-v_already\)/);
  assert.match(sql,/relationship-research:approved-source:/);
  assert.match(sql,/on conflict \(dedupe_key\) do nothing/);
  assert.match(sql,/pg_try_advisory_xact_lock/);
  assert.match(sql,/Europe\/Amsterdam/);
});

test('only pre-existing human-approved non-suppressed business contacts may be researched',()=>{
  assert.match(sql,/extra->>'human_approved',''\) = 'true'/);
  assert.match(sql,/not \(coalesce\(c\.extra,'\{\}'::jsonb\) \? 'approval_revoked'\)/);
  assert.match(sql,/powerhouse_email_contact_suppressions/);
  assert.match(sql,/s\.active=true/);
  for(const violation of ['unsubscribe','opt_out','do_not_contact','complaint','negative_reply']){
    assert.ok(sql.includes("'"+violation+"'"),violation);
  }
  assert.match(sql,/interval '90 days'/);
  assert.match(sql,/interval '30 days'/);
});

test('internal research cannot be mistaken for authorized, delivered commercial email',()=>{
  assert.match(sql,/'research_enrichment','internal'/);
  assert.match(sql,/'external_side_effect_allowed',false/);
  assert.match(sql,/'delivery_not_attempted',true/);
  assert.match(sql,/'recipient_authority_not_inferred',true/);
  assert.match(sql,/'provider_delivery_proven',false/);
  assert.doesNotMatch(sql,/\bnet\.http_post\s*\(/i);
  // The ORIGINAL research worker may mark an INTERNAL research action done; that is not an email send.
  assert.match(sql,/'external_outreach_executed',false/);
});

test('security definer priming function is not directly callable by browser roles',()=>{
  assert.match(sql,/security definer/);
  assert.match(sql,/revoke all on function public\.powerhouse_prime_approved_connection_research_v1\(date\)\s+from public,anon,authenticated/);
  assert.match(sql,/grant execute on function public\.powerhouse_prime_approved_connection_research_v1\(date\)\s+to service_role/);
});
