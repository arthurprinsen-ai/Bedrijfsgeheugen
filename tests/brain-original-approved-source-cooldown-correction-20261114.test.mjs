import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261114090000_original_approved_source_cooldown_false_block_v1.sql',import.meta.url),'utf8');

test('original priming source-cooldown is seven days rather than global 30-day false block',()=>{
  assert.match(sql,/a\.created_at>=v_now-interval '7 days'/);
  assert.doesNotMatch(sql,/a\.created_at>=v_now-interval '30 days'/);
  assert.match(sql,/public\.powerhouse_prime_approved_connection_research_v1/);
});
test('recipient safety boundaries unchanged by source-only correction',()=>{
  assert.match(sql,/v_daily_cap integer := 5/);
  assert.match(sql,/90 days/);
  assert.match(sql,/human_approved/);
  assert.match(sql,/approval_revoked/);
  assert.match(sql,/powerhouse_email_contact_suppressions/);
  assert.match(sql,/negative_reply/);
  assert.match(sql,/external_side_effect_allowed',false/);
  assert.match(sql,/recipient_authority_not_inferred',true/);
  assert.match(sql,/provider_delivery_proven',false/);
});
test('idempotent original internal source work only, no new scheduler or sender',()=>{
  assert.match(sql,/'research_enrichment','internal'/);
  assert.match(sql,/relationship-research:approved-source:/);
  assert.match(sql,/on conflict \(dedupe_key\) do nothing/);
  assert.match(sql,/pg_try_advisory_xact_lock/);
  assert.doesNotMatch(sql,/cron\.schedule\s*\(/i);
  assert.doesNotMatch(sql,/net\.http_post\s*\(/i);
});
test('privileged source priming may not be invoked by browser users',()=>{
  assert.match(sql,/security definer/i);
  assert.match(sql,/revoke all on function public\.powerhouse_prime_approved_connection_research_v1\(date\)/);
  assert.match(sql,/from public,anon,authenticated/);
  assert.match(sql,/grant execute on function public\.powerhouse_prime_approved_connection_research_v1\(date\)/);
});
