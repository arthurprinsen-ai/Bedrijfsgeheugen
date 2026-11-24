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
