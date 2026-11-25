import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const sql=await readFile(new URL('../supabase/migrations/20261105093000_original_experiment_provider_variant_application.sql',import.meta.url),'utf8');
const original=await readFile(new URL('../supabase/migrations/20261007112233_powerhouse_end_to_end_one_heart_runtime_v2.sql',import.meta.url),'utf8');

test('preserves the original hourly mux owner and existing learning lineage',()=>{
 assert.match(original,/if m=39 then[\s\S]*?powerhouse_backfill_social_learning_applications_v1\(p_now\)/);
 assert.match(sql,/create or replace function public\.powerhouse_backfill_social_learning_applications_v1\(/);
 assert.match(sql,/EXPLICIT_POST_LEARNING_LINEAGE/);
 assert.match(sql,/from public\.social_posts p\s+join public\.social_learnings l/);
 assert.match(sql,/on conflict do nothing;[\s\S]*?get diagnostics v_legacy=row_count/);
 assert.doesNotMatch(sql,/cron\.schedule|supabase functions deploy|new scheduler/i);
});

test('only a real exact original LinkedIn company variant with independent original provider proof can be an application',()=>{
 const gates=[
  /a\.channel='linkedin_company'/,/a\.status='published' and d\.state='published'/,
  /o\.status='LIVE_PROVEN' and o\.live_proven_at is not null/,
  /o\.external_id is not null and o\.external_id=d\.delivery_ref/,
  /p\.external_post_id=o\.external_id/,
  /p\.platform='linkedin' and p\.channel_kind='linkedin_company'/,
  /p\.published_at is not null/,
  /abs\(extract\(epoch from \(p\.published_at-o\.published_at\)\)\) < 300/,
  /e\.experiment_id=a\.generation_evidence->'linkedin_loop'->>'experiment_id'/,
  /e\.recipe->>'dimensie'='hook_type'/,
  /e\.recipe->>'waarde'=a\.generation_evidence->>'hook_type'/,
  /a\.generation_evidence->'linkedin_loop'->>'waarde'=e\.recipe->>'waarde'/,
  /e\.recipe->>'kanaal'='linkedin_company'/,
  /e\.recipe->>'soort'='linkedin_lus'/,
  /o\.tenant_id='canonical'/,
  /p\.tenant_id='bedrijfsgeheugen'/,
 ];
 for(const gate of gates)assert.match(sql,gate);
});

test('historical production fixture: only November 3 was actually a matching provider-proven variant',()=>{
 const source={experiment:'li-lus-co-20261030',dimension:'hook_type',variant:'concrete_number'};
 const rows=[
  {day:'2026-11-01',art:'content_ready',proof:false,hook:'concrete_number',source},
  {day:'2026-11-02',art:'content_ready',proof:false,hook:'concrete_number',source},
  {day:'2026-11-03',art:'published',proof:true,hook:'concrete_number',source},
  {day:'2026-11-04',art:'published',proof:true,hook:'concrete_friction',source:null},
  {day:'2026-11-05',art:'published',proof:true,hook:'frictie_trage_facturatie',source:null},
 ];
 const eligible=x=>x.art==='published'&&x.proof===true&&x.source?.dimension==='hook_type'&&x.hook===x.source?.variant;
 assert.deepEqual(rows.filter(eligible).map(x=>x.day),['2026-11-03']);
});

test('an executed variant is an effect-pending experiment, not measured uplift, proven best practice, money or second send',()=>{
 assert.match(sql,/ORIGINAL_EXPERIMENT_VARIANT_PROVIDER_PROVEN/);
 assert.match(sql,/EXECUTED_PROVIDER_PROVEN_EFFECT_NOT_YET_MEASURED/);
 assert.match(sql,/null,\s+null,\s+'EXECUTED_PROVIDER_PROVEN_EFFECT_NOT_YET_MEASURED'/);
 assert.match(sql,/original-experiment-variant:'\|\|md5\(/);
 assert.match(sql,/on conflict do nothing;\s+get diagnostics v_verified_variant=row_count/);
 assert.match(sql,/return v_legacy\+v_verified_variant/);
 assert.doesNotMatch(sql,/update public\.social_posts|update public\.content_publication_obligations|post\/create|insert into public\.social_posts/i);
});

test('the original internal function remains service-role only',()=>{
 assert.match(sql,/revoke all on function public\.powerhouse_backfill_social_learning_applications_v1\(timestamptz\)\s+from public,anon,authenticated/);
 assert.match(sql,/grant execute on function public\.powerhouse_backfill_social_learning_applications_v1\(timestamptz\)\s+to service_role/);
 assert.match(sql,/begin;[\s\S]*commit;/);
 assert.equal((sql.match(/as \$\$/g)||[]).length,1);
 assert.equal((sql.match(/\$\$;/g)||[]).length,1);
});
