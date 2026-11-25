import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const radar=readFileSync('supabase/functions/powerhouse-mira-problem-radar/index.ts','utf8');
const rotation=readFileSync('supabase/migrations/20261115162500_original_personal_source_supplier_completeness_v4.sql','utf8');
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
 assert.match(rotation,/create or replace function public\.powerhouse_ensure_personal_source_rotation_v2\(p_date date\)/i);
 assert.ok(rotation.includes("length(trim(coalesce(r.evidence->>'source_text',''))) >= 240"));
 assert.ok(rotation.includes("length(trim(s_existing.excerpt)) >= 240"));
 assert.ok(rotation.includes('length(trim(s.excerpt)) >= 240'));
 assert.ok(rotation.includes("right(trim(s.excerpt),3) <> '...'"));
 assert.ok(rotation.includes("right(trim(s.excerpt),1) <> '…'"));
 assert.ok(rotation.includes("s.source_url not ilike 'https://google.com/goto%'"));
 assert.ok(rotation.includes("s.source_published_at is not null"));
 assert.ok(rotation.includes("on conflict (dedupe_key) do nothing"));
 assert.ok(rotation.includes("original_source_quarantine"));
 assert.ok(rotation.includes("existing_original_source_claim_preserved"));
 assert.ok(!rotation.includes("on conflict (dedupe_key) do update"));
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
 assert.ok(radar.includes("const miraBusinessSourceReady=supply.ok&&errors.length===0"));
 assert.ok(radar.includes("const allSourceReady=miraBusinessSourceReady&&personalPublishingSourceReady"));
 assert.ok(radar.includes('ok:miraBusinessSourceReady'));
 assert.ok(radar.includes('sourceReady:miraBusinessSourceReady'));
 assert.ok(radar.includes('allSourceReady,'));
 assert.ok(radar.includes('MIRA_SOURCE_READY_PERSONAL_RECOVERY_DUE'));
 assert.ok(radar.includes('personalSourceRecovery:personalPublishingSourceReady?null:'));
 assert.ok(radar.includes("personalSourceState:!personalStoryDue?'NOT_DUE':personalPublishingSourceReady?'SOURCE_READY':'SOURCE_RECOVERY_DUE'"));
 assert.ok(radar.includes('personal-radar:source-supply:'));
 assert.ok(radar.includes('brain_observe_failure'));
 assert.ok(radar.includes('personalFirstPersonSourceViolations(candidate.evidence||{},runDate)'));
 assert.ok(radar.includes('genuinePersonalStoryReady'));
 assert.ok(radar.includes('original-personal:first-person-user-fact:'));
 assert.ok(radar.includes('provider_post_proven:false,no_second_scheduler:true'));
});
