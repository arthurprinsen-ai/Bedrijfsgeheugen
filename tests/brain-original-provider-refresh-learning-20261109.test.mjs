import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const sql=await readFile(
 new URL('../supabase/migrations/20261109152200_original_social_provider_refresh_learning_v1.sql',import.meta.url),'utf8');
const original=await readFile(
 new URL('../supabase/migrations/20261105102500_original_social_experiment_provider_outcome_feedback_v1.sql',import.meta.url),'utf8');
const owner=await readFile(
 new URL('../supabase/migrations/20261007112233_powerhouse_end_to_end_one_heart_runtime_v2.sql',import.meta.url),'utf8');

test('same original minute39 owner, same company post application, no second writer or scheduler',()=>{
 assert.match(owner,/if m=39 then[\s\S]*?powerhouse_backfill_social_learning_applications_v1\(p_now\)/);
 assert.match(sql,/create or replace function public\.powerhouse_backfill_social_learning_applications_v1/);
 assert.match(sql,/application_role='ORIGINAL_EXPERIMENT_VARIANT_PROVIDER_PROVEN'/);
 assert.match(sql,/insert into public\.social_learning_evaluations/);
 assert.match(sql,/insert into public\.social_learnings/);
 assert.match(sql,/update public\.social_learning_applications a/);
 assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|create table|alter table|provider_create/i);
 assert.equal((sql.match(/create or replace function/gi)||[]).length,1);
});
test('source exact owner/tenant, independent publisher, maturity window, and event identity still required',()=>{
 for(const text of [
   "a.tenant_id='bedrijfsgeheugen'","a.application_role='ORIGINAL_EXPERIMENT_VARIANT_PROVIDER_PROVEN'",
   "m.source='windsor-linkedin-company'","m.data_quality='PROVIDER_OBSERVED_LINKED'",
   "m.metrics->>'independent_proof'='EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT'",
   "m.metrics->>'provider_organization_urn'='urn:li:organization:18234216'",
   "m.metrics->>'provider_post_urn'=p.external_post_id",
   "m.observed_at>=p.published_at+interval '24 hours'",
   "m.observed_at<=p.published_at+interval '8 days'","a.actual_effect is null"]){
   assert.ok(sql.includes(text),'missing original gate: '+text);
 }
});
test('already measured application remains eligible for later independent source snapshots',()=>{
 assert.match(original,/a\.verification_status='EXECUTED_PROVIDER_PROVEN_EFFECT_NOT_YET_MEASURED'/);
 assert.match(sql,/a\.verification_status in \([\s\S]*'EXECUTED_PROVIDER_PROVEN_EFFECT_NOT_YET_MEASURED',[\s\S]*'PROVIDER_METRICS_OBSERVED_LOW_EXPOSURE',[\s\S]*'PROVIDER_METRICS_OBSERVED_NO_CONTROL'/);
 assert.match(sql,/not exists \([\s\S]*?from public\.social_learning_evaluations existing/);
 assert.match(sql,/existing\.evaluation_id='original-variant-observation:'\|\|[\s\S]*?md5\(a\.application_id\|\|'\|'\|\|m\.source_event_id\)/);
 assert.match(sql,/existing\.evidence->>'source_event_id'=m\.source_event_id/);
 assert.match(sql,/order by m\.observed_at,m\.source_event_id limit 4/);
 assert.match(sql,/order by a\.applied_at,a\.application_id limit 20/);
});
test('new independent observation does not inflate controlled sample or claim causal improvement',()=>{
 assert.match(sql,/on conflict \(tenant_id,evaluation_id\) do nothing/);
 assert.match(sql,/if v_affected=0 then continue; end if;/);
 assert.match(sql,/effect_size,sample_size,confidence,status[\s\S]*?'TESTING'/);
 assert.match(sql,/status='TESTING'/);
 assert.match(sql,/l\.fingerprint in/);
 assert.match(sql,/jsonb_array_elements\(coalesce\(l\.evidence_refs,'\[\]'::jsonb\)\)/);
 assert.match(sql,/ref->>'provider_source_event_id'=r\.source_event_id/);
 assert.match(sql,/causal_improvement_verified',false/);
 assert.match(sql,/verified_control_group',false/);
 assert.match(sql,/metric_scope','DESCRIPTIVE_EXPOSURE_NOT_CAUSAL_LIFT'/);
 assert.doesNotMatch(sql,/set actual_effect\s*=|status='PROVEN'|realized_revenue_eur|set sample_size\s*=/i);
});
test('one source event replays once, second event remains separately eligible',()=>{
 const app='original-experiment-variant:9644c448f90d0b9e986268f2c97aa3b9';
 const old='windsor:linkedin-company:urn:li:share:7523338311717965825:2026-11-03';
 const refreshed='windsor:linkedin-company:urn:li:share:7523338311717965825:2026-11-08';
 const digested=a=>[app,a].join('|');
 const receipts=new Set([digested(old)]);
 const staged=[old,refreshed].filter(event=>!receipts.has(digested(event)));
 assert.deepEqual(staged,[refreshed]);
 receipts.add(digested(refreshed));
 assert.deepEqual([old,refreshed].filter(event=>!receipts.has(digested(event))),[]);
 assert.ok(sql.includes("'original-variant-observation:'||md5(r.application_id||'|'||r.source_event_id)"));
});
test('least privilege original ACL remains unchanged',()=>{
 assert.match(sql,/revoke all on function public\.powerhouse_backfill_social_learning_applications_v1\(timestamptz\)[\s\S]*?from public,anon,authenticated/);
 assert.match(sql,/grant execute on function public\.powerhouse_backfill_social_learning_applications_v1\(timestamptz\)[\s\S]*?to service_role/);
 assert.equal((sql.match(/as \$\$/g)||[]).length,1);
 assert.equal((sql.match(/\$\$;/g)||[]).length,1);
});
