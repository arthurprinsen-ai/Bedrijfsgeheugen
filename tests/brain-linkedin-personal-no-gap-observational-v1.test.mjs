import assert from 'node:assert/strict';
import fs from 'node:fs';

const review=fs.readFileSync('supabase/functions/bg-pre-publish-review/index.ts','utf8');
const publisher=fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const orchestrator=fs.readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');
const migration=fs.readFileSync('supabase/migrations/20261003105500_linkedin_personal_no_gap_observational_v2.sql','utf8');

assert.match(migration,/verified_public_theme_observation/);
assert.match(migration,/story_family_reuse_forbidden/);
assert.match(migration,/recommendation_type not in \('verified_personal_source_rotation','verified_unused_personal_source'\)/);
assert.match(migration,/first_person_claims_present',false/);
assert.match(migration,/prediction_lineage_present',true/);
assert.match(migration,/prior_prediction_decision_id/);

assert.match(review,/observational_personal_theme_verified/);
assert.match(review,/OBSERVATIONAL_MODE_FINAL_TEXT_FIRST_PERSON_FORBIDDEN/);
assert.match(review,/PUBLIC_THEME_SOURCE_UNVERIFIED/);
assert.match(review,/OBSERVATIONAL_PERSONAL_LIFE_CONTEXT_REQUIRED/);

assert.match(publisher,/linkedin-personal-canonical-current/);
assert.match(publisher,/personal_pinned_secret/);
assert.match(publisher,/observationalMode/);
assert.match(publisher,/observational_personal_theme_verified:sourceEvidence\.observational_personal_theme_verified===true/);

assert.match(orchestrator,/observationalMode/);
assert.match(orchestrator,/personalNoGapReopen/);
assert.match(orchestrator,/observational_personal_theme_verified/);
assert.match(orchestrator,/Gebruik GEEN ik\/mijn\/mij\/me-vorm/);
assert.match(orchestrator,/personalFinalCopyValid\(bodyText,personalSource\?\.evidence\|\|\{\}\)/);

console.log('LinkedIn personal no-gap observational fallback contract locked');
