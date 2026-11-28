import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const candidate=readFileSync('docs/changes/2026-11-24-original-linkedin-founder-gate-alignment.sql','utf8');
const migration=readFileSync('supabase/migrations/20261124185702_original_linkedin_founder_identity_gate_alignment.sql','utf8');
const marker='CREATE OR REPLACE FUNCTION public.enforce_linkedin_personal_artifact_identity_gate_v3()';
test('exact independently exercised trigger bodies are materialized without rewriting original history',()=>{
 assert.ok(candidate.includes(marker));
 assert.equal(migration.slice(migration.indexOf(marker)),candidate.slice(candidate.indexOf(marker)));
 assert.equal((migration.match(/CREATE OR REPLACE FUNCTION public\.enforce_linkedin_personal_(?:artifact|obligation)_identity_gate_v3\(\)/g)||[]).length,2);
 assert.doesNotMatch(migration,/SECURITY DEFINER|DISABLE TRIGGER|DROP TRIGGER|UPDATE public\.powerhouse_content_artifacts|UPDATE public\.content_publication_obligations/i);
});
test('founder-specific path cannot fall through to legacy truth and validates source revision',()=>{
 assert.match(migration,/CASE WHEN founder_mode THEN founder_ok ELSE \(truth_ok or observational_ok or builder_ok\) END/);
 for(const key of ['recommendation_id','source_lineage','source_text','sensitive_private_approval','research_source_evidence','personal_founder_perspective_policy','first_person_claims_verified','founder_view_event_verified','new.tenant_id','r.run_date','r.target_channel','source_fact.fact_ref']) assert.ok(migration.includes(key),key);
 assert.match(migration,/new\.tenant_id='canonical'/);
 assert.match(migration,/AND a\.body !~\*/);
 assert.match(migration,/AND new\.body !~\*/);
});
test('verified isolated PostgreSQL replay includes actual false negative, tampering, consent, provenance and all original modes',()=>{
 const l=JSON.parse(readFileSync('brain/learning/2026-11-24-original-linkedin-founder-gate-alignment.json','utf8'));
 const a=l.evaluation.isolated_trigger_replay.outcomes,b=l.evaluation.extended_isolated_trigger_replay.outcomes;
 assert.equal(a.length+b.length,19);
 for(const id of ['actual_bad_copy','bad_copy_legacy_truth_flags','tampered_legacy_mode','wrong_source_revision','wrong_date','rejected_source','private_without_consent','unverified_research','missing_direct_user_provenance']){const row=[...a,...b].find(x=>x.case_id===id);assert.ok(row,id);assert.equal(row.artifact_allowed,false);assert.equal(row.obligation_allowed,false);}
 for(const id of ['verified_founder_opinion','legacy_builder','legacy_observational','legacy_personal_truth']){const row=[...a,...b].find(x=>x.case_id===id);assert.ok(row,id);assert.equal(row.artifact_allowed,true);assert.equal(row.obligation_allowed,true);}
});
