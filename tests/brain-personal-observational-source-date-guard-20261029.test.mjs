import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync('supabase/migrations/20261029095800_personal_observational_source_date_guard.sql','utf8');
test('same v2 function and existing service-only permissions remain',()=>{assert.match(sql,/create or replace function public\.powerhouse_ensure_personal_source_rotation_v2\(p_date date\)/i);assert.match(sql,/security definer/i);assert.match(sql,/revoke execute on function public\.powerhouse_ensure_personal_source_rotation_v2\(date\) from public,anon,authenticated/i);assert.match(sql,/grant execute on function public\.powerhouse_ensure_personal_source_rotation_v2\(date\) to service_role,postgres/i)});
test('source must be originally dated, fresh, provider-confirmed, non-future, unique and factual',()=>{
 assert.match(sql,/s\.source_published_at is not null/i);
 assert.match(sql,/s\.source_published_at >= \(p_date::timestamptz - interval '45 days'\)/i);
 assert.match(sql,/s\.source_published_at < \(p_date::timestamptz \+ interval '1 day'\)/i);
 assert.match(sql,/source_publication_date_status'='FRESH_PUBLICATION_CONFIRMED'/);
 assert.match(sql,/not exists \(/i);
 assert.match(sql,/public_theme_source_url/);
 assert.match(sql,/source_publication_date_verified',true/);
 assert.match(sql,/no_unused_verified_dated_public_theme_source/);
});
test('no duplicate publishing, bypass, historical repair reset, broad table rewrite or second scheduler',()=>{
 assert.match(sql,/on conflict \(dedupe_key\) do update/);
 assert.match(sql,/topic_key=excluded.topic_key/);
 assert.match(sql,/first_person_claims_present',false/);
 assert.match(sql,/story_family_reuse_forbidden',true/);
 assert.doesNotMatch(sql,/drop (function|table)|truncate|cron\.schedule|delete from|content_publication_obligations.+(update|delete)/i);
});
