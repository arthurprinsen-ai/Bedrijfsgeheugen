import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const radar=readFileSync('supabase/functions/powerhouse-mira-problem-radar/index.ts','utf8');
const sql=readFileSync('supabase/migrations/20261115162000_personal_observation_source_no_resurrection_v1.sql','utf8');
const editor=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');

test('same original 8-query radar: only 2 personal sources use existing Tavily advanced snippets',()=>{
 for(const src of [
  'const search=async(q:string,channel:string)',
  "personalDepth=channel==='linkedin_personal'",
  "search_depth:personalDepth?'advanced':'basic'",
  "personalDepth?{chunks_per_source:3}:{}",
  'result:await search(q,channel)',
  'sourceResponses=await Promise.all(queries.map',
  'eligible:total>=0.72&&publication.eligible&&personalSourceTextComplete',
  'PERSONAL_OBSERVATIONAL_SOURCE_TEXT_INCOMPLETE'
 ])assert.ok(radar.includes(src),src);
 assert.doesNotMatch(radar,/cron\.schedule|new ParallelPublisher|MAKE_FALLBACK_SCHEDULER/);
});

test('protected original #5874 source rotator remains nonresurrecting and aligned to strict writer',()=>{
 for(const src of [
  'CREATE OR REPLACE FUNCTION public.powerhouse_ensure_personal_source_rotation_v2(p_date date)',
  'length(trim(s.excerpt)) >= 240',
  'length(trim(s_existing.excerpt)) >= 240',
  "right(trim(s.excerpt),3) <> '...'",
  "right(trim(s.excerpt),1) <> '…'",
  'original_source_quarantine',
  'on conflict (dedupe_key) do nothing',
  'get diagnostics v_rows = row_count',
  'existing_original_source_claim_preserved',
  "s.source_url like 'https://%'",
  'source_published_at::date between (p_date - 45) and p_date',
  'revoke execute on function public.powerhouse_ensure_personal_source_rotation_v2(date) from public, anon, authenticated',
  'grant execute on function public.powerhouse_ensure_personal_source_rotation_v2(date) to service_role, postgres'
 ]) assert.ok(sql.toLowerCase().includes(src.toLowerCase()),src);
 assert.ok(editor.includes('observedText.length >= 240'));
 assert.doesNotMatch(sql,/on conflict \(dedupe_key\) do update|cron\.schedule|net\.http_post|delete from|truncate\s/i);
});

test('personal shortage is typed in SAME original ONE BRAIN, never a fake all-channel green',()=>{
 for(const src of [
  "personalSourceReady=!personalRotation.error && personalRotation.data?.ok===true",
  'const allSourceReady=supply.ok&&personalSourceReady',
  'ok:errors.length===0&&allSourceReady',
  'sourceReady:allSourceReady',
  "personalSourceState:personalSourceReady?'SOURCE_READY':'SOURCE_RECOVERY_DUE'",
  'personal-radar:source-supply:',
  'brain_observe_failure',
  'provider_post_proven:false,no_second_scheduler:true'
 ])assert.ok(radar.includes(src),src);
});
