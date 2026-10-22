import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Compare exact immutable SQL Git blob content; never create executable duplicates.
const contracts = [
  {
    "test": "tests/brain-instagram-mira-winner-selection-v1.test.mjs",
    "legacy": "supabase/migrations/20260920110000_instagram_daily_winner_lineage_v1.sql",
    "archive": "supabase/migration-history/repository-only/20260920110000_instagram_daily_winner_lineage_v1.sql",
    "sha": "d66c4119fe0e75a4622f35fd7d420f31bd7dadf8"
  },
  {
    "test": "tests/brain-linkedin-composio-authority.test.mjs",
    "legacy": "supabase/migrations/20260928122000_social_provider_write_terminal_reconcile_v1.sql",
    "archive": "supabase/migration-history/repository-only/20260928122000_social_provider_write_terminal_reconcile_v1.sql",
    "sha": "92d198eb4f1d3b473a1f495fe226a6813095ac6d"
  },
  {
    "test": "tests/brain-linkedin-personal-dual-truth-terminal-v1.test.mjs",
    "legacy": "supabase/migrations/20261003152500_linkedin_personal_dual_truth_terminal_v1.sql",
    "archive": "supabase/migration-history/repository-only/20261003152500_linkedin_personal_dual_truth_terminal_v1.sql",
    "sha": "19911ee195c38b0f06373cac3064c08b4680fb56"
  },
  {
    "test": "tests/brain-linkedin-personal-no-gap-observational-v1.test.mjs",
    "legacy": "supabase/migrations/20261003105500_linkedin_personal_no_gap_observational_v2.sql",
    "archive": "supabase/migration-history/repository-only/20261003105500_linkedin_personal_no_gap_observational_v2.sql",
    "sha": "25f6c217a51136474074d25e13036ae3e01f384b"
  },
  {
    "test": "tests/brain-linkedin-sales-bounded-prep-v1.test.mjs",
    "legacy": "supabase/migrations/20260929163500_linkedin_sales_bounded_prep_v1.sql",
    "archive": "supabase/migration-history/repository-only/20260929163500_linkedin_sales_bounded_prep_v1.sql",
    "sha": "f11c4728dd5c119f709bf9352fe47e04ab6d8b5b"
  },
  {
    "test": "tests/brain-personal-linkedin-source-dedupe-current-main-v1.test.mjs",
    "legacy": "supabase/migrations/20260925081000_linkedin_personal_source_dedupe_current_main_v1.sql",
    "archive": "supabase/migration-history/repository-only/20260925081000_linkedin_personal_source_dedupe_current_main_v1.sql",
    "sha": "8fb940d57fe29aaa8ed9025c71039f3688bcbffb"
  },
  {
    "test": "tests/brain-powerhouse-autonomous-outreach-v1.test.mjs",
    "legacy": "supabase/migrations/20260928112500_powerhouse_autonomous_relationship_outreach_v1.sql",
    "archive": "supabase/migration-history/repository-only/20260928112500_powerhouse_autonomous_relationship_outreach_v1.sql",
    "sha": "59a914ea1e98c7090c1094c6fcd6a9dbb1c65ba7"
  },
  {
    "test": "tests/supabase-powerhouse-autonomous-outreach-v1.test.mjs",
    "legacy": "supabase/migrations/20260928112500_powerhouse_autonomous_relationship_outreach_v1.sql",
    "archive": "supabase/migration-history/repository-only/20260928112500_powerhouse_autonomous_relationship_outreach_v1.sql",
    "sha": "59a914ea1e98c7090c1094c6fcd6a9dbb1c65ba7"
  },
  {
    "test": "tests/brain-powerhouse-manual-linkedin-dm-handoff-v1.test.mjs",
    "legacy": "supabase/migrations/20260928162500_bg_vandaag_manual_dm_handoff_v1.sql",
    "archive": "supabase/migration-history/repository-only/20260928162500_bg_vandaag_manual_dm_handoff_v1.sql",
    "sha": "157128be1e3ff485117bf1507abe11341e171d01"
  },
  {
    "test": "tests/brain-powerhouse-source-backed-all-channels-lineage-v1.test.mjs",
    "legacy": "supabase/migrations/20260929211500_powerhouse_source_backed_all_channels_lineage_v1.sql",
    "archive": "supabase/migration-history/repository-only/20260929211500_powerhouse_source_backed_all_channels_lineage_v1.sql",
    "sha": "a7f944e3258ef15a7d0cf27cc184642082a490f2"
  },
  {
    "test": "tests/brain-powerhouse-source-backed-all-channels-lineage-v1.test.mjs",
    "legacy": "supabase/migrations/20260929214500_powerhouse_source_backed_channel_selection_v1.sql",
    "archive": "supabase/migration-history/repository-only/20260929214500_powerhouse_source_backed_channel_selection_v1.sql",
    "sha": "38093d030c3c5197f9eff36b33eb2e26f673845f"
  },
  {
    "test": "tests/brain-powerhouse-source-backed-all-channels-lineage-v1.test.mjs",
    "legacy": "supabase/migrations/20260929223000_powerhouse_source_backed_blog_semantic_coherence_v1.sql",
    "archive": "supabase/migration-history/repository-only/20260929223000_powerhouse_source_backed_blog_semantic_coherence_v1.sql",
    "sha": "b5d06d77f576fe66aa05b124320680a5658c0438"
  },
  {
    "test": "tests/brain-social-publication-daily-channel-fence-v1.test.mjs",
    "legacy": "supabase/migrations/20260922080500_social_publication_daily_channel_fence_v1.sql",
    "archive": "supabase/migration-history/repository-only/20260922080500_social_publication_daily_channel_fence_v1.sql",
    "sha": "26fe2989875a10465a284b9e985efa6fb884ba88"
  },
  {
    "test": "tests/brain-social-publisher-dispatching-state-contract.test.mjs",
    "legacy": "supabase/migrations/20260920102000_social_publisher_dispatching_state_contract.sql",
    "archive": "supabase/migration-history/repository-only/20260920102000_social_publisher_dispatching_state_contract.sql",
    "sha": "60743f2e201e8c1523ca421fefbe36ba5a44a543"
  },
  {
    "test": "tests/brain-publication-authority-pgcrypto-qualification.test.mjs",
    "legacy": "supabase/migrations/20260920102500_publication_authority_pgcrypto_qualification.sql",
    "archive": "supabase/migration-history/repository-only/20260920102500_publication_authority_pgcrypto_qualification.sql",
    "sha": "f7a8b15e73b629012271190d3098ca04d90556cf"
  },
  {
    "test": "tests/brain-social-daily-self-healing-v1.test.mjs",
    "legacy": "supabase/migrations/20260927153500_social_daily_self_healing_v1.sql",
    "archive": "supabase/migration-history/repository-only/20260927153500_social_daily_self_healing_v1.sql",
    "sha": "e8ccb9f9ad7d225428520841df25d0a3ebab6ed7"
  }
];
function gitBlob(sql) { return createHash('sha1').update('blob '+Buffer.byteLength(sql)+'\0').update(sql).digest('hex'); }
for(const contract of contracts){
  test('historical social SQL oracle '+contract.test+' '+contract.archive,()=>{
    const original=readFileSync(contract.test,'utf8');
    const sql=readFileSync(contract.archive,'utf8');
    assert.ok(sql.trim().length>0,'archived source must be nonempty');
    assert.equal(gitBlob(sql),contract.sha,'immutable historical SQL Git blob drift');
    assert.ok(original.includes(contract.archive),'archived source pointer required');
    assert.ok(!original.includes(contract.legacy),'retired executable path must not return');
    assert.equal(existsSync(contract.legacy),false,'no executable duplicate historical migration');
  });
}
