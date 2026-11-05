import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const sql=await readFile(new URL('../supabase/migrations/20261105080000_original_linkedin_learning_source_truth.sql',import.meta.url),'utf8');
const producer=await readFile(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');

test('same original learning owner reads the actual personal provider tenant instead of the brand tenant',()=>{
 assert.match(sql,/create or replace function public\.bg_social_lus_meting\(/);
 assert.match(sql,/case when p_channel='linkedin_personal' then 'canonical' else 'bedrijfsgeheugen' end/);
 assert.match(sql,/p\.channel_kind = p_channel/);
 assert.match(sql,/join posts on s\.tenant_id=posts\.tenant_id and s\.post_id=posts\.post_id/);
 assert.match(producer,/bg_social_lus_cyclus/);
 assert.doesNotMatch(sql,/cron\.schedule|new sender|supabase functions deploy/i);
});

test('reactions-only provider observations remain observed; a genuine zero is data, absent metric is not',()=>{
 assert.match(sql,/jsonb_typeof\(l\.metrics->'reactions'\)='number'/);
 assert.match(sql,/\(l\.metrics->>'reactions'\)::numeric/);
 assert.match(sql,/when jsonb_typeof\(l\.metrics->'likes'\)='number' or jsonb_typeof\(l\.metrics->'comments'\)='number'/);
 assert.match(sql,/else null\s+end as reacties/);
 assert.match(sql,/gemeten',[\s\S]*?reacties is not null/);
 assert.match(sql,/impressies_beschikbaar/);
 const observed={reactions:0,metric_scope:'reactions_only',views_unavailable:true};
 assert.equal(typeof observed.reactions,'number');
 assert.equal(observed.reactions,0);
 assert.equal(Object.prototype.hasOwnProperty.call(observed,'impressions'),false);
});

test('no absent impressions ⇒ fake low-impressions recommendation',()=>{
 assert.match(sql,/v_med_imp is not null and v_med_imp < 50/);
 assert.match(sql,/v_med_imp is null and v_med_re is not null and v_med_re < 1/);
 assert.match(sql,/BEREIK_NIET_BESCHIKBAAR/);
 assert.doesNotMatch(sql,/coalesce\(v_med_imp, 0\) < 50/);
});

test('no valid baseline or no measured sample cannot promote a winner or invent a published variant',()=>{
 assert.match(sql,/v_baseline_ok := coalesce\(\(e\.basislijn->>'gemeten'\)::int,0\) >= v_min/);
 assert.match(sql,/v_uplift := case when v_baseline_ok and v_n>=v_min/);
 assert.match(sql,/if v_n < v_min or not v_baseline_ok then v_status := 'INSUFFICIENT_EVIDENCE'/);
 assert.match(sql,/effect_is_causal', false/);
 assert.match(sql,/v_besluit := 'verkennend_positief'; v_lstatus := 'TESTING'/);
 assert.match(sql,/Do NOT mark all observed posts as applications of a variant/);
 assert.match(sql,/insert into public\.social_learnings \(/);
 assert.match(sql,/actual_variant_application_verified',false/);
 assert.match(sql,/Verkennend, niet causaal bewezen/);
 assert.match(sql,/where public\.social_learnings\.status<>'PROVEN'/);
 assert.doesNotMatch(sql,/insert into public\.social_learning_applications/);
});

test('maintain original function signatures and explicit least-privilege roles',()=>{
 for(const signature of ['bg_social_lus_meting(text,timestamptz,timestamptz)',
   'bg_social_lus_cyclus(text,date)','bg_social_lus_beoordelen(date)']){
  assert.ok(sql.includes('revoke all on function public.'+signature+' from public,anon,authenticated'));
  assert.ok(sql.includes('grant execute on function public.'+signature+' to service_role'));
 }
 assert.equal((sql.match(/create or replace function public\.bg_social_lus_/g)||[]).length,3);
 assert.equal((sql.match(/as \$\$/g)||[]).length,3, 'all functions need SQL dollar-quote openings');
 assert.equal((sql.match(/\$\$;/g)||[]).length,3, 'all SQL dollar-quote endings must balance');
 assert.match(sql,/begin;[\s\S]*commit;/);
});
