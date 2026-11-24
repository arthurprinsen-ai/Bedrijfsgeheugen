import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  personalFirstPersonSourceViolations,
  personalFirstPersonCopyViolations,
  isPersonalPublicationDay
} from '../supabase/functions/_shared/personal-first-person-story-gate.mjs';

const sql=fs.readFileSync(new URL('../supabase/migrations/20261116110100_personal_linkedin_life_only_producer_v1.sql',import.meta.url),'utf8');
const orchestrator=fs.readFileSync(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
const publisher=fs.readFileSync(new URL('../supabase/functions/powerhouse-social-publisher/index.ts',import.meta.url),'utf8');
const skill=fs.readFileSync(new URL('../.agents/skills/personal-linkedin-life-only/SKILL.md',import.meta.url),'utf8');
const date='2026-11-16';

const permittedPersonalSource={
 personal_truth_verified:true,arthur_anchor_verified:true,first_person_claims_verified:true,
 personal_life_topic:true,business_topic:false,corporate_voice:false,
 company_page_interchangeable:false,forced_business_moral:false,
 personal_life_only_policy:'personal-linkedin-personal-life-only-v1',
 source_text:'Ik vroeg zelf hoe ik de groene aanslag op de tegels kon aanpakken. Deze tekst is een kunstmatige regressiefixture, niet een echte goedgekeurde publicatie.',
 source_lineage:['current-chat:user-fact:synthetic-test-only'],
 content_id:'test-only:never-a-real-post',
 sensitive_private_detail:false
};
test('production source ends 12 conflicting October founder instructions and asserts personal-life replacement',()=>{
 assert.match(sql,/UPDATE public\.bg_schrijfregels/);
 assert.match(sql,/status='vervallen'/);
 const ids=[
 'rci-personal-standup','personal-linkedin-language-rotation-v1',
 'personal-linkedin-software-data-bi-ai-intelligence-v1','personal-linkedin-value-priority-v1',
 'personal-linkedin-first-person-dream-voice-v1','personal-linkedin-journey-proof-v1',
 'personal-linkedin-predictive-external-impact-v1','personal-linkedin-daily-dream-journey-v1',
 'personal-linkedin-entrepreneur-problem-evidence-v1','personal-linkedin-founder-journey-v2',
 'personal-linkedin-dream-builder-v1','personal-linkedin-dream-builder-human-language-v1'
 ];
 for(const id of ids)assert.ok(sql.includes("'"+id+"'"),id);
 assert.match(sql,/personal-linkedin-life-only-first-person-20261116-v1/);
 assert.match(sql,/ON CONFLICT \(regel_id\) DO UPDATE/);
 assert.match(sql,/geen publicatie|geen zakelijke fallback/i);
});
test('legacy v2 producer stops making AI-founder personal posts while keeping v1 all-channel route',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_materialize_source_backed_channel_candidates_v2/);
 assert.match(sql,/v_base := public\.powerhouse_materialize_source_backed_channel_candidates_v1\(p_date\)/);
 assert.doesNotMatch(sql,/insert into public\.powerhouse_content_recommendations/i);
 assert.match(sql,/personal_editorial_rejection','PERSONAL_BUSINESS_SOURCE_FORBIDDEN'/);
 assert.match(sql,/linkedin_personal_ai_native_builder_recommendation_id',null/);
 assert.match(sql,/target_channel='linkedin_personal'/);
 assert.match(sql,/status IN \('suggested','accepted'\)/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_materialize_source_backed_channel_candidates_v2/);
 assert.match(sql,/TO service_role/);
});
test('same original orchestrator and publisher reject a business proposal with Arthur voice',()=>{
 assert.match(orchestrator,/recs\.filter\(validPersonalSource\)/);
 assert.match(orchestrator,/personalFirstPersonSourceViolations\(e,/);
 assert.match(publisher,/personalLastMilePublicationViolations/);
 const business={...permittedPersonalSource,business_topic:true,
   ai_native_builder_story_verified:true,source_lineage:['powerhouse_content_artifacts:old-business'],
   content_id:'ai-native-builder:2026-11-16'};
 const failures=personalFirstPersonSourceViolations(business,date);
 assert.ok(failures.includes('PERSONAL_VERIFIED_BUILDER_SOURCE_REQUIRED'));
 assert.ok(failures.includes('PERSONAL_VERIFIED_BUILDER_SOURCE_REQUIRED'));
 assert.ok(failures.includes('PERSONAL_GENERATED_OR_PUBLIC_ARTICLE_SOURCE_FORBIDDEN'));
});
test('fresh synthetic first-person event may pass content gate without ever authorizing a provider write',()=>{
 assert.deepEqual(personalFirstPersonSourceViolations(permittedPersonalSource,date),[]);
 const personalCopy='Ik vroeg laatst hoe ik de groene aanslag van de tegels af krijg. Eerst keek ik naar de tegels, daarna vroeg ik naar een middel. Meer was er niet gebeurd.';
 assert.deepEqual(personalFirstPersonCopyViolations(personalCopy,permittedPersonalSource,date),[]);
 // Source validation is NOT the final SHA review, user confirmation or provider ID.
 assert.ok(skill.includes('15 november 2026 — bindende echte ik-verhalen'));
});
test('old news, Sunday and unapproved sensitive family details always fail',()=>{
 const news={...permittedPersonalSource,observational_personal_theme_verified:true};
 assert.ok(personalFirstPersonSourceViolations(news,date).length>0);
 const sensitive={...permittedPersonalSource,sensitive_private_detail:true};
 assert.ok(personalFirstPersonSourceViolations(sensitive,date).includes('PERSONAL_PRIVATE_DETAIL_NOT_APPROVED'));
 assert.equal(isPersonalPublicationDay('2026-11-15'),false);
 assert.ok(personalFirstPersonSourceViolations(permittedPersonalSource,'2026-11-15').includes('PERSONAL_SUNDAY_OR_INVALID_DATE'));
});
test('original single-writer no external send, no inserted authorization, and negative duplicate history',()=>{
 assert.doesNotMatch(sql,/\b(?:create\s+trigger|create\s+extension|create\s+policy|insert\s+into\s+public\.social_posts)\b/i);
 assert.match(sql,/legacy_personal_business_candidates_quarantined/);
 assert.match(sql,/personal_first_person_source_required',true/);
 assert.match(skill,/Nooit.*bedrijfsnieuws|geen.*bedrijfsfallback/i);
});
