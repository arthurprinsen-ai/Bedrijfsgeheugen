# 2026-10-22 — Historical social SQL oracle recovery
Obligation: ci-brain-historical-social-oracle-batch-20261022

Original BRAIN run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39671036043: 3511 tests; 3190 passed, 321 failed. Exact main: 8ea724b80bdd81a5f31b9224254c6630eab3be6c.

## Concrete repair
14 original test files retain all original functional and security assertions; only their obsolete historical SQL source paths change. 16 original file-to-archive mappings are pinned to 15 independently read-back, nonempty Git blobs. tests/brain-inherited-social-sql-archive-source-guard-v1.test.mjs detects blob identity drift, empty SQL, removed-path regressions and attempts to restore obsolete SQL as executable migrations.

- `tests/brain-instagram-mira-winner-selection-v1.test.mjs` → `supabase/migration-history/repository-only/20260920110000_instagram_daily_winner_lineage_v1.sql` (`d66c4119fe0e75a4622f35fd7d420f31bd7dadf8`)
- `tests/brain-linkedin-composio-authority.test.mjs` → `supabase/migration-history/repository-only/20260928122000_social_provider_write_terminal_reconcile_v1.sql` (`92d198eb4f1d3b473a1f495fe226a6813095ac6d`)
- `tests/brain-linkedin-personal-dual-truth-terminal-v1.test.mjs` → `supabase/migration-history/repository-only/20261003152500_linkedin_personal_dual_truth_terminal_v1.sql` (`19911ee195c38b0f06373cac3064c08b4680fb56`)
- `tests/brain-linkedin-personal-no-gap-observational-v1.test.mjs` → `supabase/migration-history/repository-only/20261003105500_linkedin_personal_no_gap_observational_v2.sql` (`25f6c217a51136474074d25e13036ae3e01f384b`)
- `tests/brain-linkedin-sales-bounded-prep-v1.test.mjs` → `supabase/migration-history/repository-only/20260929163500_linkedin_sales_bounded_prep_v1.sql` (`f11c4728dd5c119f709bf9352fe47e04ab6d8b5b`)
- `tests/brain-personal-linkedin-source-dedupe-current-main-v1.test.mjs` → `supabase/migration-history/repository-only/20260925081000_linkedin_personal_source_dedupe_current_main_v1.sql` (`8fb940d57fe29aaa8ed9025c71039f3688bcbffb`)
- `tests/brain-powerhouse-autonomous-outreach-v1.test.mjs` → `supabase/migration-history/repository-only/20260928112500_powerhouse_autonomous_relationship_outreach_v1.sql` (`59a914ea1e98c7090c1094c6fcd6a9dbb1c65ba7`)
- `tests/supabase-powerhouse-autonomous-outreach-v1.test.mjs` → `supabase/migration-history/repository-only/20260928112500_powerhouse_autonomous_relationship_outreach_v1.sql` (`59a914ea1e98c7090c1094c6fcd6a9dbb1c65ba7`)
- `tests/brain-powerhouse-manual-linkedin-dm-handoff-v1.test.mjs` → `supabase/migration-history/repository-only/20260928162500_bg_vandaag_manual_dm_handoff_v1.sql` (`157128be1e3ff485117bf1507abe11341e171d01`)
- `tests/brain-powerhouse-source-backed-all-channels-lineage-v1.test.mjs` → `supabase/migration-history/repository-only/20260929211500_powerhouse_source_backed_all_channels_lineage_v1.sql` (`a7f944e3258ef15a7d0cf27cc184642082a490f2`)
- `tests/brain-powerhouse-source-backed-all-channels-lineage-v1.test.mjs` → `supabase/migration-history/repository-only/20260929214500_powerhouse_source_backed_channel_selection_v1.sql` (`38093d030c3c5197f9eff36b33eb2e26f673845f`)
- `tests/brain-powerhouse-source-backed-all-channels-lineage-v1.test.mjs` → `supabase/migration-history/repository-only/20260929223000_powerhouse_source_backed_blog_semantic_coherence_v1.sql` (`b5d06d77f576fe66aa05b124320680a5658c0438`)
- `tests/brain-social-publication-daily-channel-fence-v1.test.mjs` → `supabase/migration-history/repository-only/20260922080500_social_publication_daily_channel_fence_v1.sql` (`26fe2989875a10465a284b9e985efa6fb884ba88`)
- `tests/brain-social-publisher-dispatching-state-contract.test.mjs` → `supabase/migration-history/repository-only/20260920102000_social_publisher_dispatching_state_contract.sql` (`60743f2e201e8c1523ca421fefbe36ba5a44a543`)
- `tests/brain-publication-authority-pgcrypto-qualification.test.mjs` → `supabase/migration-history/repository-only/20260920102500_publication_authority_pgcrypto_qualification.sql` (`f7a8b15e73b629012271190d3098ca04d90556cf`)
- `tests/brain-social-daily-self-healing-v1.test.mjs` → `supabase/migration-history/repository-only/20260927153500_social_daily_self_healing_v1.sql` (`e8ccb9f9ad7d225428520841df25d0a3ebab6ed7`)

No schema, migration, RLS/ACL, runtime, provider, scheduler, auth, or production modification. Original tests were not disabled or skipped. This is a source-verified **unreleased candidate**, NOT a full test-run success.

## Remaining mandatory evidence
Exact head Required and CodeQL, full Unified BRAIN backend with zero failing, release readback and unchanged AGENTS.md protection. Independent #3742 supported Supabase local/remote migration parity and clean-room replay; #4215 two independently authenticated real tenant readbacks. Never assert production-green before these succeed.

## Exact-head Required recovery

Required test run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39757936632 failed canonical learning validation because evaluation directly referenced non-BRAIN-prefixed `tests/supabase-powerhouse-autonomous-outreach-v1.test.mjs`. A new BRAIN-prefixed test wrapper `tests/brain-inherited-social-supabase-oracle-replay-v1.test.mjs` imports and runs that original complete source test. No assertion or release gate was waived; fresh Required and full BRAIN remain mandatory.
