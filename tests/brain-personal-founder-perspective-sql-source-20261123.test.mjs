import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 isVerifiedPersonalFounderPerspective, PERSONAL_FOUNDER_PERSPECTIVE_POLICY,
 personalFirstPersonSourceViolations
} from '../supabase/functions/_shared/personal-first-person-story-gate.mjs';
const sql=readFileSync('supabase/migrations/20261123214500_personal_founder_perspective_v2_materializer_alignment.sql','utf8');
const old=readFileSync('supabase/migrations/20261120143500_personal_verified_founder_source_v2_policy_alignment.sql','utf8');

const base={
 content_id:'verified-owner-position:2026-11-23',
 source_kind:'verified_personal_source',
 source_text:'Ik wil dat AI en bedrijfssoftware problemen in begrijpelijke stappen echt oplossen, met het bewijs van de uiteindelijke uitkomst in plaats van alleen een dashboard.',
 source_lineage:['current-chat:user-fact:2026-11-23:personal-positioning'],
 personal_founder_perspective_verified:true,
 personal_founder_perspective_policy:PERSONAL_FOUNDER_PERSPECTIVE_POLICY,
 founder_view_event_verified:true,
 founder_view_event_kind:'direct_user_stated_design_preference',
 source_backed:true,personal_truth_verified:true,arthur_anchor_verified:true,
 first_person_claims_present:true,first_person_claims_verified:true,business_topic:true,
 personal_life_topic:false,corporate_voice:false,company_page_interchangeable:false,
 forced_business_moral:false,ai_native_builder_story_verified:false,
 observational_personal_theme_verified:false,public_theme_source_verified:false,
 research_claims_present:false,
 identity_contract:'arthur-personal-linkedin-identity-v4',
 identity_gate_version:'channel-identity-hard-gate-v3'
};
test('old v2 quarantine has no third source class; successor creates it without creating another writer',()=>{
 assert.doesNotMatch(old,/is_verified_founder_perspective/);
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_materialize_source_backed_channel_candidates_v2/);
 assert.match(sql,/v_base := public\.powerhouse_materialize_source_backed_channel_candidates_v1\(p_date\)/);
 assert.match(sql,/is_verified_user_founder/);
 assert.match(sql,/is_verified_founder_perspective/);
 assert.match(sql,/AND NOT c\.is_verified_user_founder\s+AND NOT c\.is_verified_founder_perspective/);
 assert.match(sql,/PERSONAL_BUSINESS_SOURCE_FORBIDDEN/);
 assert.match(sql,/v_perspective_id/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_materialize_source_backed_channel_candidates_v2\(date\)\s+TO service_role/);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_materialize_source_backed_channel_candidates_v2\(date\)\s+FROM PUBLIC,anon,authenticated/);
});
test('SQL and original source predicate insist on same direct-owner provenance and research evidence',()=>{
 assert.equal(isVerifiedPersonalFounderPerspective(base),true);
 assert.deepEqual(personalFirstPersonSourceViolations(base,'2026-11-24'),[]);
 for (const key of [
  'personal_founder_perspective_verified','personal_founder_perspective_policy',
  'founder_view_event_verified','founder_view_event_kind','source_lineage','source_text',
  'personal_truth_verified','first_person_claims_verified','first_person_claims_present',
  'business_topic','personal_life_topic','identity_contract','identity_gate_version',
  'corporate_voice','company_page_interchangeable','forced_business_moral',
  'research_source_evidence','research_claims_present','ai_native_builder_story_verified'
 ])assert.ok(sql.includes(key),'SQL must enforce '+key);
 assert.match(sql,/jsonb_typeof\(r\.evidence->'research_source_evidence'\) = 'array'/);
 assert.match(sql,/source_fact\.fact_ref ~\*/);
});
test('uninformed generic founder marketing, external articles and unsourced research remain denied',()=>{
 assert.equal(isVerifiedPersonalFounderPerspective({...base,source_lineage:['https://example.org/article']}),false);
 assert.equal(isVerifiedPersonalFounderPerspective({...base,research_claims_present:true,research_source_evidence:[{url:'https://example.org',verified:false}]}),false);
 assert.equal(isVerifiedPersonalFounderPerspective({...base,founder_view_event_verified:false}),false);
 assert.equal(isVerifiedPersonalFounderPerspective({...base,corporate_voice:true}),false);
 assert.equal(isVerifiedPersonalFounderPerspective({...base,personal_life_topic:true}),false);
});
