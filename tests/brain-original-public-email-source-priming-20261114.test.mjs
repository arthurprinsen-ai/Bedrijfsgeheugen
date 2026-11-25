import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261114210000_original_public_work_email_source_priming_v1.sql',import.meta.url),'utf8');
const original=readFileSync(new URL('../supabase/migrations/20261114091500_original_outreach_source_research_cooldown_scope_v2.sql',import.meta.url),'utf8');

test('original #116 source owner keeps ONE five/day budget, explicit two missing and three existing cohorts',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_prime_approved_connection_research_v1/);
  assert.match(sql,/v_daily_cap integer := 5/);
  assert.match(sql,/v_already >= v_daily_cap/);
  assert.match(sql,/c\.cohort_rank<=2/);
  assert.match(sql,/c\.cohort_rank<=3/);
  assert.match(sql,/PUBLIC_WORK_EMAIL_CANDIDATE/);
  assert.match(sql,/APPROVED_SOURCE/);
  assert.match(sql,/research_need'.*case/s);
  assert.match(sql,/public_work_email_source/);
  assert.match(sql,/source_specific_evidence/);
  assert.match(sql,/on conflict \(dedupe_key\) do nothing/);
  assert.match(original,/provider-attempted or dedicated/);
});
test('research-only missing-email cohort requires existing warm relationship, business identity and lawful safe stop',()=>{
  assert.match(sql,/c\.status in \('in_gesprek','aangeboden','rust'\)/);
  assert.match(sql,/c\.prioriteit >= 75/);
  assert.match(sql,/c\.linkedin_url/);
  assert.match(sql,/c\.rol/);
  assert.match(sql,/\? 'do_not_contact'/);
  assert.match(sql,/\? 'opt_out'/);
  assert.match(sql,/approval_revoked/);
  assert.match(sql,/unsubscribe','opt_out','do_not_contact','complaint','negative_reply/);
  assert.match(sql,/research_only_no_outbound/);
  assert.match(sql,/'research_send_authority',false/);
  assert.match(sql,/external_send_executed',false/);
  assert.match(sql,/REVOKE ALL ON FUNCTION/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION.*service_role/);
  assert.doesNotMatch(sql,/cron\.schedule|GMAIL_SEND_EMAIL|smtp\.|HUNTER_EMAIL_FINDER|APOLLO_PEOPLE_ENRICHMENT/i);
});
test('no provider migration history is falsely asserted applied by the candidate',()=>{
  assert.doesNotMatch(sql,/insert\s+into\s+supabase_migrations|update\s+supabase_migrations/i);
  assert.match(sql,/limit greatest\(0,v_daily_cap-v_already\)/);
});
