import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const migrationPath='supabase/migration-history/20261005140000_powerhouse_one_loop_terminal_lineage_v1.sql';
const sql=await readFile(migrationPath,'utf8');
const workflow=await readFile('.github/workflows/whole-brain-canonical-loop-v2.yml','utf8');
const canon=JSON.parse(await readFile('brain/contracts/powerhouse-operating-canon-v1.json','utf8'));

test('migration replay rejects truncated PostgreSQL dollar quote delimiters',async()=>{
  const invalid=[];
  for(const file of await readdir('supabase/migrations')){
    if(!file.endsWith('.sql')) continue;
    const source=await readFile(`supabase/migrations/${file}`,'utf8');
    source.split(/\r?\n/).forEach((line,index)=>{
      if(/^\s*(?:as\s+\$|\$;)\s*$/i.test(line)) invalid.push(`${file}:${index+1}`);
    });
  }
  assert.deepEqual(invalid,[],'PostgreSQL dollar quotes require $$ or matching $tag$ delimiters');
});

test('persuasion runtime function definitions terminate before privilege statements',async()=>{
  const source=await readFile('supabase/migration-history/20261005123000_powerhouse_human_commercial_persuasion_runtime_v1.sql','utf8');
  assert.doesNotMatch(source,/end\s+\$function\$/i,'PL/pgSQL END requires a semicolon inside the function body');
  assert.doesNotMatch(source,/\$function\$\s*\n\s*(?:revoke|grant|create)\b/i,'CREATE FUNCTION requires a semicolon after its quoted body');
});

test('outbound lineage replay defines the private reply evidence table before consuming it',async()=>{
  const source=await readFile('supabase/migration-history/20260929211500_powerhouse_source_backed_all_channels_lineage_v1.sql','utf8');
  assert.match(source,/create table if not exists public\.powerhouse_email_reply_events\b/i);
  assert.match(source,/unique\s*\(provider,\s*provider_message_id\)/i,'provider replies must remain idempotent');
  assert.match(source,/references public\.powerhouse_sales_actions\(action_id\) on delete cascade/i);
  assert.match(source,/alter table public\.powerhouse_email_reply_events enable row level security/i);
  assert.match(source,/revoke all on (?:table )?public\.powerhouse_email_reply_events from public,\s*anon,\s*authenticated/i);
  assert.match(source,/grant all on (?:table )?public\.powerhouse_email_reply_events to service_role/i);
  assert.ok(source.indexOf('create table if not exists public.powerhouse_email_reply_events')<source.indexOf('from public.powerhouse_email_reply_events'),'schema must precede its first assurance consumer');
  const contracts=JSON.parse(await readFile('config/powerhouse-quality-surface-contracts.json','utf8'));
  const surface=contracts.surfaces.find(item=>item.id==='table:public.powerhouse_email_reply_events');
  assert.equal(surface?.required,true,'reply evidence must have a mandatory quality surface contract');
  assert.equal(surface?.evidence_contract,'tests/brain-powerhouse-one-loop-terminal-lineage-v1.test.mjs');
});

test('channel capability replay preserves the private provider evidence contract',async()=>{
  const source=await readFile('supabase/migration-history/20261005113000_powerhouse_rocket_revenue_event_spine_v1.sql','utf8');
  assert.match(source,/create table if not exists public\.powerhouse_channel_capabilities_v1\b/i);
  assert.ok(source.indexOf('create table if not exists public.powerhouse_channel_capabilities_v1')<source.indexOf('create or replace view public.powerhouse_next_best_action_contract_v1'));
  assert.match(source,/capability_key text primary key/i);
  assert.match(source,/check\s*\(status in\s*\('AVAILABLE','DEGRADED','UNAVAILABLE','CONFIG_REQUIRED'\)\)/i);
  assert.match(source,/alter table public\.powerhouse_channel_capabilities_v1 enable row level security/i);
  assert.match(source,/revoke all on public\.powerhouse_channel_capabilities_v1 from public,anon,authenticated/i);
  assert.match(source,/grant all on public\.powerhouse_channel_capabilities_v1 to service_role/i);
  const contracts=JSON.parse(await readFile('config/powerhouse-quality-surface-contracts.json','utf8'));
  assert.equal(contracts.surfaces.find(item=>item.id==='table:public.powerhouse_channel_capabilities_v1')?.required,true);
});

test('orchestrator replay preserves existing message-plan view columns before appending intelligence',async()=>{
  const source=await readFile('supabase/migration-history/20261005135000_powerhouse_human_commercial_orchestrator_v1.sql','utf8');
  const view=source.slice(source.indexOf('create or replace view public.powerhouse_commercial_message_plan_v1'),source.indexOf('revoke all on public.powerhouse_commercial_message_plan_v1'));
  const projection=view.slice(view.lastIndexOf('\nselect\n')).replace(/--[^\n]*/g,'');
  assert.match(projection,/c\.expected_value_eur,\s*c\.stage_hint/);
  assert.match(projection,/c\.predicted_objection,\s*coalesce\(c\.company_intent_score,0::numeric\) intent_hint,\s*coalesce\(c\.relationship_warmth,0::numeric\) warmth_hint,\s*c\.has_verified_trigger/);
  assert.match(projection,/\) message_plan,\s*c\.relationship_warmth/);
  assert.doesNotMatch(view,/drop view/i,'dependent consumers must be retained');
});

test('all legacy commercial loop versions are compatibility aliases to the one canonical v1 owner',()=>{
  for(const version of [2,3,4,5,6]){
    assert.match(sql,new RegExp(`create or replace function public\\.powerhouse_commercial_closed_loop_v${version}`,'i'));
  }
  const aliasRefs=(sql.match(/select public\.powerhouse_one_commercial_closed_loop_v1\(p_run_date\)/gi)||[]).length;
  assert.equal(aliasRefs,5);
  assert.match(sql,/non_alias_legacy_loop_count/i);
});

test('compatibility aliases can replay before the later canonical implementation',()=>{
  const aliases=sql.slice(0,sql.indexOf('-- 2. Every terminal action'));
  assert.doesNotMatch(aliases,/language sql/i,'SQL aliases resolve the later function during CREATE and break fresh replay');
  assert.equal((aliases.match(/language plpgsql/gi)||[]).length,5);
  assert.equal((aliases.match(/return \(select public\.powerhouse_one_commercial_closed_loop_v1\(p_run_date\)\);/gi)||[]).length,5);
  assert.doesNotMatch(aliases,/check_function_bodies|exception when|return ['"]?\{['"]?/i,'missing implementation must remain a runtime error');
});

test('commercial health replay defines the exact content-bound quality gate before its view',async()=>{
  const source=await readFile('supabase/migration-history/20261005160500_powerhouse_one_commercial_closed_loop_v1.sql','utf8');
  const canonical=await readFile('supabase/migrations/20261005144606_powerhouse_one_commercial_closed_loop_v2.sql','utf8');
  const start='CREATE OR REPLACE FUNCTION public.powerhouse_outbound_message_quality_ready_v1';
  const end='GRANT EXECUTE ON FUNCTION public.powerhouse_outbound_message_quality_ready_v1(p_action_id uuid) TO service_role;';
  assert.ok(source.indexOf(start)>=0,'fresh replay requires the actual quality function, not a stub');
  assert.ok(source.indexOf(start)<source.indexOf('create or replace view public.powerhouse_one_commercial_loop_health_v1'));
  const definition=text=>text.slice(text.indexOf(start),text.indexOf(end)+end.length);
  assert.equal(definition(source),definition(canonical),'preserve the exact hash and persisted evidence gate');
});

test('terminal action lineage is automatic and does not fabricate observed business outcomes',()=>{
  assert.match(sql,/create trigger trg_powerhouse_sales_action_terminal_lineage_v1/i);
  assert.match(sql,/business_outcome_state/i);
  assert.match(sql,/outcome_obligation/i);
  assert.match(sql,/observed_business_outcome/i);
  assert.match(sql,/Lifecycle closure is not an observed business outcome/i);
  assert.doesNotMatch(sql,/insert\s+into\s+public\.powerhouse_sales_outcomes/i);
  assert.match(sql,/for update skip locked/i);
  assert.match(sql,/powerhouse_backfill_terminal_lineage_v1/i);
});

test('exactly one full commercial scheduler owner is canonicalised and split-stage legacy owners are disabled',()=>{
  assert.match(sql,/powerhouse-one-commercial-loop-daily-v1/i);
  assert.match(sql,/powerhouse_one_commercial_decision_loop_v1/i);
  assert.match(sql,/powerhouse-commercial-context-daily-v1/i);
  assert.match(sql,/powerhouse-commercial-actions-daily-v1/i);
  assert.match(sql,/cron\.unschedule/i);
  assert.doesNotMatch(sql,/update\s+cron\.job/i);
});

test('runtime regression gate proves scheduler alias and terminal lineage invariants',()=>{
  assert.match(sql,/create or replace function public\.powerhouse_one_loop_regression_gate_v1/i);
  assert.match(sql,/canonical_scheduler_owner_count/i);
  assert.match(sql,/active_split_stage_scheduler_count/i);
  assert.match(sql,/unaccounted_terminal_action_count/i);
  assert.match(sql,/open_observed_outcome_obligations/i);
  assert.match(sql,/bg_gezondheid/i);
});

test('whole-brain workflow permanently runs the one-loop canonicalisation regression',()=>{
  assert.match(workflow,/powerhouse-one-loop-terminal-lineage-v1\.test\.mjs/i);
});

test('operating canon declares one runtime loop and shared wiring surfaces',()=>{
  assert.equal(canon.one_loop_runtime?.contract,'powerhouse-one-loop-terminal-lineage-v1');
  assert.equal(canon.one_loop_runtime?.full_loop_scheduler_owner,'powerhouse-one-commercial-loop-daily-v1');
  for(const surface of ['heartbeat','powerhouse_brain','intelligence_layers','agents','chat','portal']){
    assert.ok(canon.one_loop_runtime?.wired_surfaces?.includes(surface),`missing wired surface: ${surface}`);
  }
});
