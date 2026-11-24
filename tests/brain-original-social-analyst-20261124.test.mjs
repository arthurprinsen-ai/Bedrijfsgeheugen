import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read = name => readFile(new URL('../supabase/migrations/'+name+'.sql', import.meta.url), 'utf8');
const measurement = await read('20261124063737_original_social_loop_comparable_provider_windows');
const decisions = await read('20261124063938_original_social_analyst_variant_rotation_and_proof');
const normalization = await read('20261124064216_original_personal_artifact_evidence_lossless_normalization');

test('comparable provider windows cannot mix tenants, post IDs or post ages',()=>{
 assert.match(measurement,/s\.tenant_id=posts\.tenant_id and s\.post_id=posts\.post_id/);
 assert.match(measurement,/posts\.published_at \+ interval '24 hours'/);
 assert.match(measurement,/posts\.published_at \+ interval '36 hours'/);
 assert.match(measurement,/s\.metrics->>'provider_post_urn'=posts\.external_post_id/);
 assert.match(measurement,/order by s\.post_id, s\.observed_at asc/);
 assert.match(measurement,/v_basis > 0/);
 assert.match(measurement,/else null end as imp/);
});
test('original analyst rotates verifiable company variants rather than repeating a winner without proof',()=>{
 assert.match(decisions,/recent_tests asc/);
 assert.match(decisions,/interval '60 days'/);
 assert.match(decisions,/array\['hook_type'\]/);
 assert.match(decisions,/4, 7, p_run_date \+ 7/);
 assert.match(decisions,/greatest\(coalesce\(e\.min_steekproef, 4\),4\)/);
 assert.match(decisions,/original-experiment-variant:'\|\|md5/);
 assert.match(decisions,/EXACT_VARIANT_COHORT_NOT_CAUSAL/);
 assert.match(decisions,/effect_is_causal', false/);
 assert.doesNotMatch(decisions,/cron\.schedule|insert into public\.social_learning_applications/i);
});
test('lossless normalization keeps original identity gate and never changes post body or delivery state',()=>{
 assert.match(normalization,/pg_input_is_valid/);
 assert.match(normalization,/new\.generation_evidence := \(new\.generation_evidence#>>'\{\}'\)::jsonb/);
 assert.match(normalization,/LINKEDIN_PERSONAL_IDENTITY_GATE_BLOCKED/);
 assert.match(normalization,/not \(truth_ok or observational_ok or builder_ok\)/);
 assert.match(normalization,/set generation_evidence = \(generation_evidence#>>'\{\}'\)::jsonb/);
 assert.doesNotMatch(normalization,/disable trigger|set status\s*=|set body\s*=/i);
});

const personalAnalysis = await read('20261124064859_original_personal_observational_analyst');
test('personal observational cohort requires exact copy and provider receipt, not model assignment',()=>{
 assert.match(personalAnalysis,/d\.delivery_ref=o\.external_id/);
 assert.match(personalAnalysis,/independent_public_full_copy_matched'='true'/);
 assert.match(personalAnalysis,/independent_public_readback_verified'='true'/);
 assert.match(personalAnalysis,/final_text_hash'=encode\(sha256\(convert_to\(a\.body,'UTF8'\)\),'hex'\)/);
 assert.match(personalAnalysis,/source_event_id is not null/);
 assert.match(personalAnalysis,/cohorts where n>=4 and length_group<>'other'/);
 assert.match(personalAnalysis,/'variant_assignment_proven',false/);
 assert.match(personalAnalysis,/'causal_effect_proven',false/);
 assert.match(personalAnalysis,/'linkedin-personal-observed-length-v1'/);
 assert.match(personalAnalysis,/status='TESTING' and public\.social_learnings\.evidence_refs is distinct from excluded\.evidence_refs/);
 assert.doesNotMatch(personalAnalysis,/cron\.schedule|update public\.powerhouse_content_artifacts/i);
});

import {personalLengthPreference,personalLengthGuide,personalLengthDraftReceipt} from '../supabase/functions/_shared/personal-observational-length-guide.mjs';
const observed={contract:'personal_exact_copy_observational_length_v1',causal_effect_proven:false,variant_assignment_proven:false,metric:'reactions',preferred_length:'160-179',cohorts:[{length_group:'130-159',n:4,median_reactions:5},{length_group:'160-179',n:5,median_reactions:7},{length_group:'180-200',n:2,median_reactions:6.5}]};
test('personal authoring consumes only a sufficiently evidenced personal observational preference',()=>{
 const p=personalLengthPreference('linkedin_personal',observed);
 assert.equal(p.preferred_length,'160-179');
 assert.match(personalLengthGuide(p),/Geen verplicht quotum/);
 assert.match(personalLengthGuide(p),/Bronwaarheid/);
 assert.equal(personalLengthPreference('linkedin_company',observed),null);
 assert.equal(personalLengthPreference('linkedin_personal',{...observed,causal_effect_proven:true}),null);
 assert.equal(personalLengthPreference('linkedin_personal',{...observed,cohorts:[observed.cohorts[1]]}),null);
 assert.equal(personalLengthPreference('linkedin_personal',{...observed,preferred_length:'180-200'}),null);
 const receipt=personalLengthDraftReceipt(p,Array(167).fill('woord').join(' '));
 assert.equal(receipt.draft_word_count,167);
 assert.equal(receipt.draft_in_preferred_band,true);
 assert.equal(receipt.provider_application_verified,false);
 assert.equal(personalLengthDraftReceipt(p,'kort').draft_in_preferred_band,false);
});
test('original orchestrator consumes sanitized personal guidance after channel policy and records draft only',async()=>{
 const orchestrator=await readFile(new URL('../supabase/functions/powerhouse-content-orchestrator/index.ts',import.meta.url),'utf8');
 assert.match(orchestrator,/personalLengthPreference\(pending.channel,linkedinLoop\?\.personal_observational_analysis\)/);
 assert.match(orchestrator,/if\(pending.channel==='linkedin_personal'\) editorialSystem \+= personalLengthInstruction/);
 assert.match(orchestrator,/PERSONAL_LIFE_CORRECTION_PROMPT\)\+personalLengthInstruction;/);
 assert.match(orchestrator,/callAI\(apiKey,gov\.model_id,correctionPrompt,revisionInput,artifactTool,budget,'low'\)/);
 assert.match(orchestrator,/generationProvider!=='approved-frozen-source'\?personalLengthDraftReceipt/);
 assert.match(orchestrator,/PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED/);
});
