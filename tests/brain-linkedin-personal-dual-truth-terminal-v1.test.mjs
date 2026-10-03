import assert from 'node:assert/strict';
import fs from 'node:fs';

const review=fs.readFileSync('supabase/functions/bg-pre-publish-review/index.ts','utf8');
const migration=fs.readFileSync('supabase/migrations/20261003152500_linkedin_personal_dual_truth_terminal_v1.sql','utf8');

assert.match(review,/const businessBlocked = observationalMode/);
assert.match(review,/observationalMode[\s\S]*Bedrijfsgeheugen/);
assert.doesNotMatch(review,/observationalMode[\s\S]{0,500}\|AI\|data\|/);

assert.match(migration,/enforce_linkedin_personal_artifact_identity_gate_v3/);
assert.match(migration,/enforce_linkedin_personal_obligation_identity_gate_v3/);
assert.match(migration,/powerhouse_reconcile_content_outcomes_v1/);
assert.match(migration,/observational_personal_theme_verified/);
assert.match(migration,/public_theme_source_verified/);
assert.match(migration,/first_person_claims_present/);
assert.match(migration,/https:\/\/www\.linkedin\.com\/feed\/update\//);
assert.match(migration,/urn:li:share:/);
assert.match(migration,/urn:li:ugcPost:/);
assert.match(migration,/PERSONAL_SOURCE_UNVERIFIED/);

console.log('LinkedIn personal dual-truth terminal contract locked');
