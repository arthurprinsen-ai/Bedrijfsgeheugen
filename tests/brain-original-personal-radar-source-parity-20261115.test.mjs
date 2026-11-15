import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const radar=readFileSync('supabase/functions/powerhouse-mira-problem-radar/index.ts','utf8');
const rotation=readFileSync('supabase/migrations/20261115150000_original_personal_observation_source_completeness_v3.sql','utf8');
const editor=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');

test('original 8-call radar gives only the 2 personal slots Tavily advanced source chunks',()=>{
 assert.ok(radar.includes("const search=async(q:string,channel:string)"));
 assert.ok(radar.includes("personalDepth=channel==='linkedin_personal'"));
 assert.ok(radar.includes("search_depth:personalDepth?'advanced':'basic'"));
 assert.ok(radar.includes("personalDepth?{chunks_per_source:3}:{}"));
 assert.ok(radar.includes("result:await search(q,channel)"));
 assert.ok(radar.includes("sourceResponses=await Promise.all(queries.map"));
 assert.ok(radar.includes("eligible:total>=0.72&&publication.eligible&&personalSourceTextComplete"));
 assert.ok(radar.includes("PERSONAL_OBSERVATIONAL_SOURCE_TEXT_INCOMPLETE"));
 assert.doesNotMatch(radar,/cron\.schedule|new ParallelPublisher|MAKE_FALLBACK_SCHEDULER/);
});
test('original SQL rotation rejects BOTH already-held and new incomplete snippets',()=>{
 assert.ok(rotation.includes('create or replace function public.powerhouse_ensure_personal_source_rotation_v2(p_date date)'));
 assert.ok(rotation.includes("length(trim(coalesce(r.evidence->>'source_text',''))) >= 240"));
 assert.ok(rotation.includes("length(trim(coalesce(s_existing.excerpt,''))) >= 240"));
 assert.ok(rotation.includes('length(trim(s.excerpt)) >= 240'));
 assert.ok(rotation.includes("right(trim(s.excerpt),3) <> '...'"));
 assert.ok(rotation.includes("right(trim(s.excerpt),1) <> '…'"));
 assert.ok(rotation.includes("s.source_url not ilike 'https://google.com/goto%'"));
 assert.ok(rotation.includes("s.source_published_at is not null"));
 assert.ok(rotation.includes('s.observed_at is not null'));
 assert.ok(rotation.includes("coalesce(r.evidence->>'public_theme_source_url','') not ilike 'https://google.com/goto%'"));
 assert.ok(rotation.includes("'source_text_complete_verified',true"));
 assert.ok(editor.includes('observedText.length >= 240'));
 assert.ok(rotation.includes('revoke execute on function public.powerhouse_ensure_personal_source_rotation_v2(date) from public, anon, authenticated'));
 assert.ok(rotation.includes('grant execute on function public.powerhouse_ensure_personal_source_rotation_v2(date) to service_role, postgres'));
 assert.doesNotMatch(rotation,/cron\.schedule|net\.http_post|delete from|truncate\s/i);
});
test('supply shortages are recorded in the SAME ONE BRAIN and cannot falsely be green',()=>{
 assert.ok(radar.includes("personalSourceReady=!personalRotation.error && personalRotation.data?.ok===true"));
 assert.ok(radar.includes("const allSourceReady=supply.ok&&personalSourceReady"));
 assert.ok(radar.includes('ok:errors.length===0&&allSourceReady'));
 assert.ok(radar.includes('sourceReady:allSourceReady'));
 assert.ok(radar.includes("personalSourceState:personalSourceReady?'SOURCE_READY':'SOURCE_RECOVERY_DUE'"));
 assert.ok(radar.includes('personal-radar:source-supply:'));
 assert.ok(radar.includes('brain_observe_failure'));
 assert.ok(radar.includes('provider_post_proven:false,no_second_scheduler:true'));
});
