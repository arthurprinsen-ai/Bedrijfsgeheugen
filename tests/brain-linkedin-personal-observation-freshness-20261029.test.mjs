import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sql=fs.readFileSync('supabase/migration-history/repository-only/20261029110000_linkedin_personal_observational_source_freshness_v1.sql','utf8');
test('same pre-existing owner, limited privileged service role only; never a second executor',()=>{
  assert.match(sql,/create or replace function public\.powerhouse_ensure_personal_source_rotation_v2\(p_date date\)/i);
  assert.match(sql,/revoke execute on function public\.powerhouse_ensure_personal_source_rotation_v2\(date\) from public, anon, authenticated/);
  assert.match(sql,/grant execute on function public\.powerhouse_ensure_personal_source_rotation_v2\(date\) to service_role, postgres/);
  assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|powerhouse_social_publisher\(/i);
});
test('selection and previously eligible observational sources require a dated source within 45 days, never observed-at as date',()=>{
  const gates=sql.match(/s(?:_existing)?\.source_published_at::date between \(p_date - 45\) and p_date/g)||[];
  assert.equal(gates.length,2);
  assert.match(sql,/s\.source_published_at is not null/);
  assert.match(sql,/s_existing\.source_published_at is not null/);
  assert.match(sql,/s\.source_url like 'https:\/\/%'/);
  assert.match(sql,/s\.total_score >= 0\.72/);
  assert.match(sql,/s\.topic_key in \(/);
  assert.doesNotMatch(sql,/observed_at::date between/);
  assert.match(sql,/no_fresh_dated_unused_personal_life_source/);
});
test('a skipped stale candidate can never be reactivated by same-date retry or masked as fresh',()=>{
  assert.match(sql,/'observational-personal-theme:'\|\|p_date::text\|\|':'\|\|v_signal\.signal_id::text/);
  assert.match(sql,/r\.status in \('suggested','accepted'\)/);
  assert.match(sql,/and coalesce\(r\.evidence->>'public_theme_source_url',''\)=s\.source_url/);
  assert.match(sql,/source_publication_date_present',true/);
  assert.match(sql,/source_published_at'/);
  assert.doesNotMatch(sql,/update public\.content_publication_obligations|delete from|truncate\s/i);
});
test('only everyday observational topics are eligible; business press not mislabeled as personal life',()=>{
  for(const topic of ['bezorging-en-pakketten','schoolapps-en-oudercommunicatie','wachtwoord-en-inloggen']) assert.ok(sql.includes("'"+topic+"'"));
  assert.doesNotMatch(sql,/'offertes-zonder-opvolging'/);
  assert.match(sql,/'first_person_claims_present',false/);
  assert.match(sql,/'business_topic',false/);
  assert.match(sql,/'story_family_reuse_forbidden',true/);
});
