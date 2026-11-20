import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 personalFirstPersonSourceViolations,
 personalFirstPersonCopyViolations
} from '../supabase/functions/_shared/personal-first-person-story-gate.mjs';

const sql=readFileSync('supabase/migrations/20261120143500_personal_verified_founder_source_v2_policy_alignment.sql','utf8');
const old=readFileSync('supabase/migrations/20261116110100_personal_linkedin_life_only_producer_v1.sql','utf8');
const original=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
const channel=JSON.parse(readFileSync('config/powerhouse-source-backed-channel-contract-v1.json','utf8'));
const e={
 content_id:'test-fixture:2026-11-20:founder-design-decision',
 ai_native_builder_story_verified:true,
 ai_native_builder_policy:'personal-linkedin-ai-native-builder-v1',
 build_event_verified:true,
 personal_truth_verified:true,
 source_backed:true,
 arthur_anchor_verified:true,
 first_person_claims_verified:true,
 first_person_claims_present:true,
 business_topic:true,
 personal_life_topic:false,
 corporate_voice:false,
 company_page_interchangeable:false,
 forced_business_moral:false,
 observational_personal_theme_verified:false,
 public_theme_source_verified:false,
 identity_contract:'arthur-personal-linkedin-identity-v4',
 identity_gate_version:'channel-identity-hard-gate-v3',
 source_text:'Ik wil software, AI, BI en data samen als één intelligent softwaresysteem ontwerpen. Deze uitspraak is een testfixture, geen productie-publicatiebewijs.',
 source_lineage:['current-chat:user-fact:synthetic-only-20261120'],
 sensitive_private_detail:false
};
test('new V2 SQL preserves Nov-16 legacy quarantine while allowing only independently sourced real founder decisions',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_materialize_source_backed_channel_candidates_v2/);
 assert.match(sql,/v_base := public\.powerhouse_materialize_source_backed_channel_candidates_v1\(p_date\)/);
 assert.match(sql,/PERSONAL_BUSINESS_SOURCE_FORBIDDEN/);
 assert.match(sql,/is_verified_user_founder/);
 assert.match(sql,/AND NOT c\.is_verified_user_founder/);
 assert.match(sql,/first_person_source_backed_with_original_review/);
 for(const key of [
  "'ai_native_builder_story_verified'",
  "'ai_native_builder_policy'",
  "'build_event_verified'",
  "'personal_truth_verified'",
  "'first_person_claims_verified'",
  "'arthur_anchor_verified'",
  "'source_backed'",
  "'business_topic'",
  "'corporate_voice'",
  "'company_page_interchangeable'",
  "'forced_business_moral'",
  "'identity_contract'",
  "'identity_gate_version'",
  "'source_text'",
  "'sensitive_private_detail'",
  "'source_lineage'"
 ])assert.ok(sql.includes(key),key);
 assert.match(sql,/current-chat:user-fact\|chat-history:user-fact/);
 assert.match(sql,/jsonb_array_elements_text/);
 assert.match(sql,/powerhouse_content_artifacts/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_materialize_source_backed_channel_candidates_v2/);
 assert.match(sql,/TO service_role/);
 assert.doesNotMatch(sql,/\b(?:CREATE\s+TRIGGER|CREATE\s+POLICY|CREATE\s+EXTENSION|INSERT\s+INTO\s+public\.social_posts|net\.http_post|create\s+cron)\b/i);
});
test('strict original first-person gate permits fact-backed own builder decision but not unverified business content',()=>{
 assert.deepEqual(personalFirstPersonSourceViolations(e,'2026-11-20'),[]);
 for(const altered of [
  {...e,build_event_verified:false},
  {...e,arthur_anchor_verified:false},
  {...e,source_backed:false},
  {...e,first_person_claims_verified:false},
  {...e,source_lineage:['powerhouse_content_artifacts:generated-company-case']},
  {...e,sensitive_private_detail:true},
  {...e,corporate_voice:true},
 ])assert.ok(personalFirstPersonSourceViolations(altered,'2026-11-20').length>0);
 const authentic='Ik heb mijn ontwerpkeuze uitgesproken: software, AI, BI en data horen in één intelligent systeem. Ik benoem hier geen klantresultaten.';
 assert.deepEqual(personalFirstPersonCopyViolations(authentic,e,'2026-11-20'),[]);
});
test('newest personal builder policy supersedes only the obsolete blanket ban, not truth or author authority',()=>{
 assert.match(old,/personal-linkedin-personal-life-only-v1/);
 assert.match(old,/PERSONAL_BUSINESS_SOURCE_FORBIDDEN/);
 assert.match(original,/builderMode = e\.ai_native_builder_story_verified === true/);
 assert.match(original,/personalFirstPersonSourceViolations/);
 assert.equal(channel.channels.linkedin_personal.personal_builder_context_intake.require_one_integrated_software_ai_bi_data_architecture,true);
 assert.equal(channel.channels.linkedin_personal.conversation_quality_20261120.independent_first_person_proof_unchanged,true);
 assert.equal(channel.channels.linkedin_personal.conversation_quality_20261120.mandatory_question_at_end,false);
});
