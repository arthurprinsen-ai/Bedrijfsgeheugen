import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';

// A historical SQL oracle is not a new executable migration.
const sources = [
  ['tests/brain-autonomous-improvement-currentstate-record-type.test.mjs','20260916182000_autonomous_improvement_currentstate_record_type_fix_v1.sql'],
  ['tests/brain-growth-swarm-bounded-refresh-v1.test.mjs','20260929165000_growth_swarm_bounded_refresh_v1.sql'],
  ['tests/brain-human-commercial-message-os-v1.test.mjs','20261005122000_powerhouse_human_commercial_message_os_v1.sql'],
  ['tests/brain-human-commercial-persuasion-runtime-v1.test.mjs','20261005123000_powerhouse_human_commercial_persuasion_runtime_v1.sql'],
  ['tests/brain-instagram-canonical-mira-identity-v1.test.mjs','20260929173500_instagram_canonical_mira_identity_guard_v1.sql'],
  ['tests/brain-instagram-meta-oauth-onboarding.test.mjs','20260921152000_instagram_meta_oauth_onboarding_v1.sql'],
  ['tests/brain-instagram-mira-reel-seed-normalization-v1.test.mjs','20260922082500_instagram_mira_reel_recommendation_normalization_v1.sql'],
  ['tests/supabase-tenant-identity-review-semantics-v2.test.mjs','20260918105000_tenant_identity_review_semantics_v2.sql'],
  ['tests/supabase-trigger-based-mkb-acquisition-runtime-v1.test.mjs','20260924131500_trigger_based_mkb_acquisition_runtime_v1.sql'],
];
for (const [testFile, sqlFile] of sources) {
  test(`historical BRAIN SQL archive source: ${sqlFile}`, () => {
    const archived = `supabase/migration-history/repository-only/${sqlFile}`;
    const executable = `supabase/migrations/${sqlFile}`;
    const testSource = readFileSync(testFile, 'utf8');
    assert.ok(testSource.includes(archived), 'original assertions must read the immutable SQL archive');
    assert.ok(!testSource.includes(executable), 'stale executable SQL reference is forbidden');
    assert.equal(existsSync(executable), false, 'never restore historical SQL as executable migration');
    assert.ok(existsSync(archived), 'archive source must be present');
    assert.ok(readFileSync(archived, 'utf8').trim().length > 0, 'archive SQL must be nonempty');
  });
}
