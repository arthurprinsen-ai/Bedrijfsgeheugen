import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sql=fs.readFileSync(new URL('../docs/changes/2026-11-23-personal-founder-perspective-v2-reviewed-source.sql',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../supabase/functions/_shared/personal-first-person-story-gate.mjs',import.meta.url),'utf8');
test('migration preserves exact canonical v2 source materializer security, with no new owner',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_materialize_source_backed_channel_candidates_v2/);
 assert.match(sql,/SECURITY DEFINER/);
 assert.match(sql,/SET search_path TO 'public', 'pg_catalog'/);
 assert.match(sql,/powerhouse_materialize_source_backed_channel_candidates_v1\(p_date\)/);
 assert.match(sql,/\$function\$;\s*$/);
 assert.doesNotMatch(sql,/DROP FUNCTION|cron\.schedule|net\.http_post|CREATE TABLE/i);
});
test('user-attested founder opinion is an independent strict source class, not a build',()=>{
 for(const key of ['personal_founder_perspective_verified','personal_founder_perspective_policy','founder_view_event_verified','founder_view_event_kind',
  'first_person_claims_present','arthur_anchor_verified','source_backed','personal_truth_verified','source_lineage','source_text',
  'research_source_evidence','identity_contract','identity_gate_version','personal_life_topic']) assert.match(sql,new RegExp(key));
 assert.match(sql,/direct_user_stated_design_preference/);
 assert.match(sql,/direct_user_approved_research_synthesis/);
 assert.match(sql,/AND NOT \(c\.is_verified_user_founder OR c\.is_verified_user_perspective\)/);
 assert.match(sql,/v_perspective_id/);
 assert.match(js,/isVerifiedPersonalFounderPerspective/);
});
test('legacy builder and quarantine remain intact',()=>{
 assert.match(sql,/AS is_verified_user_founder/);
 assert.match(sql,/ai_native_builder_policy/);
 assert.match(sql,/build_event_verified/);
 assert.match(sql,/PERSONAL_BUSINESS_SOURCE_FORBIDDEN/);
 assert.match(sql,/SOURCE_BACKED/iu);
 assert.match(sql,/original-powerhouse-social-publisher/);
});
