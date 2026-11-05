import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const sql=await readFile(new URL('../supabase/migrations/20261105102500_original_social_experiment_provider_outcome_feedback_v1.sql',import.meta.url),'utf8');
const owner=await readFile(new URL('../supabase/migrations/20261007112233_powerhouse_end_to_end_one_heart_runtime_v2.sql',import.meta.url),'utf8');
test('real descriptive outcome uses ORIGINAL bounded minute-39 learning owner and existing stores only',()=>{
 assert.match(owner,/if m=39 then[\s\S]*?powerhouse_backfill_social_learning_applications_v1\(p_now\)/);
 assert.match(sql,/create or replace function public\.powerhouse_backfill_social_learning_applications_v1/);
 assert.match(sql,/insert into public\.social_learning_evaluations/);
 assert.match(sql,/insert into public\.social_learnings/);
 assert.match(sql,/update public\.social_learning_applications a/);
 assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|create table|alter table|provider_create/i);
});
test('only the independently published original company variant and exact Windsor post proof can reach evaluation',()=>{
 assert.match(sql,/a\.application_role='ORIGINAL_EXPERIMENT_VARIANT_PROVIDER_PROVEN'/);
 assert.match(sql,/m\.data_quality='PROVIDER_OBSERVED_LINKED'/);
 assert.match(sql,/m\.source='windsor-linkedin-company'/);
 assert.match(sql,/m\.metrics->>'independent_proof'='EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT'/);
 assert.match(sql,/m\.metrics->>'provider_organization_urn'='urn:li:organization:18234216'/);
 assert.match(sql,/m\.metrics->>'provider_post_urn'=p\.external_post_id/);
 assert.match(sql,/jsonb_typeof\(m\.metrics->'impressions'\)='number'/);
 assert.match(sql,/p\.published_at\+interval '24 hours'/);
 assert.match(sql,/a\.actual_effect is null/);
});
test('low impressions are observation, NOT uplift, a business lead or optimized revenue',()=>{
 assert.match(sql,/metric_scope','DESCRIPTIVE_EXPOSURE_NOT_CAUSAL_LIFT'/);
 assert.match(sql,/exposure_minimum_reached',r\.impressions>=50/);
 assert.match(sql,/verified_control_group',false/);
 assert.match(sql,/causal_improvement_verified',false/);
 assert.match(sql,/effect_size,sample_size,confidence,status[\s\S]*?'TESTING'/);
 assert.match(sql,/PROVIDER_METRICS_OBSERVED_LOW_EXPOSURE/);
 assert.match(sql,/PROVIDER_METRICS_OBSERVED_NO_CONTROL/);
 assert.doesNotMatch(sql,/set actual_effect\s*=|status='PROVEN'|realized_revenue_eur/i);
});
test('source is bounded, idempotent and executed through least privilege',()=>{
 assert.match(sql,/order by a\.applied_at,a\.application_id limit 20/);
 assert.match(sql,/on conflict \(tenant_id,evaluation_id\) do nothing/);
 assert.match(sql,/on conflict do nothing/);
 assert.match(sql,/a\.verification_status='EXECUTED_PROVIDER_PROVEN_EFFECT_NOT_YET_MEASURED'/);
 assert.match(sql,/revoke all on function public\.powerhouse_backfill_social_learning_applications_v1\(timestamptz\)/);
 assert.match(sql,/grant execute on function public\.powerhouse_backfill_social_learning_applications_v1\(timestamptz\)[\s\S]*?to service_role/);
 assert.equal((sql.match(/as \$\$/g)||[]).length,1);
 assert.equal((sql.match(/\$\$;/g)||[]).length,1);
});
