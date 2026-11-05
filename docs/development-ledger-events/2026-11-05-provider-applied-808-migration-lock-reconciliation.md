# Append-only development ledger — original protected migration lock (2026-11-05)

- Failure fingerprint: `supabase|migration-lock|provider-applied-808-vs-source-lock-807|20261105-v1`.
- Original owner: Supabase schema-migrations identity / GitHub Required test. Parent #3742; blocked dependent PR #5457; original migration PR #5450.
- Direct provider readback: project `adhjwmvyoixzjtmiroln`, `supabase_migrations.schema_migrations`, 808 exact applied rows at `2026-11-05T15:33:22.246269Z`. Latest `20261105134200_original_data_spine_decision_receipt_same_tick_v1`. Exact same executable SQL exists in main; original lock had only 807 rows.
- Root cause: asynchronous protected source change and actual provider application advanced ahead of immutable migration identity lock. Normal Required source-lock checks therefore blocked a later unrelated candidate. Their failure was correct.
- Source resolution: append the one verified provider identity, retaining other 807, and use original independent Supabase clock as `captured_at`; do not alter SQL/provider history.
- Prevention: never accept a stale provider identity lock during PR admission, but never invent a provider-applied row to satisfy a build. Hold dependent protected merges until original lock passes.
- Regression: `tests/brain-supabase-provider-applied-808-lock-20261105.test.mjs` plus original strict suites, protected Required/CodeQL, exact main readback.
- Status: CODE_CANDIDATE; provider 808 already LIVE, GitHub lock reconciliation NOT LIVE until protected merge. No parallel migration executor.
