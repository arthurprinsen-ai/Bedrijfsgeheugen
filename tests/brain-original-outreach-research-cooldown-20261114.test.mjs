import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261114091500_original_outreach_source_research_cooldown_scope_v2.sql',import.meta.url),'utf8');
const old=readFileSync(new URL('../supabase/migrations/20261114083500_original_approved_connection_source_priming_v1.sql',import.meta.url),'utf8');

test('regression: old broad research cooldown silently excludes all eligible approved contacts',()=>{
  assert.match(old,/where a\.person_key=c\.sleutel\s+and a\.action_type='research_enrichment'\s+and a\.created_at>=v_now-interval '30 days'/);
  assert.doesNotMatch(sql,/where a\.person_key=c\.sleutel\s+and a\.action_type='research_enrichment'\s+and a\.created_at>=v_now-interval '30 days'/);
});
test('only real source attempts or same-lineage dedicated work counts as research in new 30-day cooldown',()=>{
  assert.match(sql,/a\.dedupe_key like 'relationship-research:approved-source:%'/);
  assert.match(sql,/a\.dedupe_key like 'relationship-research:outreach-source:%'/);
  assert.match(sql,/nullif\(a\.evidence#>>'\{public_research_execution,researched_at\}',''\) is not null/);
  assert.match(sql,/and \(a\.person_key=c\.sleutel\s+or lower\(btrim\(coalesce\(a\.company_key,''\)\)\)=lower\(btrim\(c\.bedrijf\)\)\)/);
});
test('still bounded and idempotent inside existing original stage, with no separate scheduler or provider send',()=>{
  assert.match(sql,/v_daily_cap integer := 5;/);
  assert.match(sql,/v_already >= v_daily_cap/);
  assert.match(sql,/limit greatest\(0,v_daily_cap-v_already\)/);
  assert.match(sql,/pg_try_advisory_xact_lock/);
  assert.match(sql,/on conflict \(dedupe_key\) do nothing/);
  assert.match(sql,/Europe\/Amsterdam/);
  assert.match(sql,/'external_side_effect_allowed',false/);
  assert.match(sql,/'provider_delivery_proven',false/);
  assert.doesNotMatch(sql,/cron\.schedule\s*\(|\bnet\.http_post\s*\(|create\s+table/i);
});
test('preserves human approval, suppressions, opt-out, cross-channel fatigue and no public execute',()=>{
  assert.match(sql,/extra->>'human_approved',''\) = 'true'/);
  assert.match(sql,/approval_revoked/);
  assert.match(sql,/powerhouse_email_contact_suppressions/);
  for(const flag of ['unsubscribe','opt_out','do_not_contact','complaint','negative_reply']){
    assert.ok(sql.includes("'"+flag+"'"),flag);
  }
  assert.match(sql,/interval '90 days'/);
  assert.match(sql,/revoke all on function public\.powerhouse_prime_approved_connection_research_v1\(date\)\s+from public,anon,authenticated/);
  assert.match(sql,/grant execute on function public\.powerhouse_prime_approved_connection_research_v1\(date\)\s+to service_role/);
});
