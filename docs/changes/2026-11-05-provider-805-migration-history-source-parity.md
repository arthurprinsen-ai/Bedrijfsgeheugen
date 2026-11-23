# Original Supabase migration history: provider 805 versus source 801 — 2026-11-05

## Independent readback (original source authorities)
- Supabase project `adhjwmvyoixzjtmiroln`, read-only `supabase_migrations.schema_migrations` at `2026-11-05T12:11:40.805Z`: exactly **805** applied migrations. Latest `20261105111500:original_15_loop_owner_coordination`.
- Git source `supabase/migration-history.lock.json` held 801 entries (captured 2026-11-04T13:07:33.991Z). The four missing identities are `20261105080000:original_linkedin_learning_source_truth`, `20261105093000:original_experiment_provider_variant_application`, `20261105102500:original_social_experiment_provider_outcome_feedback_v1` and `20261105111500:original_15_loop_owner_coordination`. Their SQL files are already in `supabase/migrations/` and already applied at the provider; do **not** execute them again.
- Original BRAIN backend lane (run 42020903893 on main head 4288508a) had **6 failing tests**, all `801 !== 805` parity or local-only-executable checks.

## Why this matters beyond the six tests
Since the 2 November self-dispatch fix, the original terminal closure no longer waits for a BRAIN run that never starts: it dispatches it. The remaining failures are that BRAIN run itself ending in `failure`. Of 40 terminal closure runs since 2 November, 26 failed; the backend lane migration-lock tests are the repeating cause on 4 and 5 November.

## Root-cause fix
- Append exactly four provider-attested rows to the original lock and advance `captured_at` to the observation time. The existing 801 rows are unchanged and in the same order.
- No test is weakened or skipped; the five affected test files pass 22 of 22 locally.
- No SQL replay, no schema or RLS change, no second migration runner or scheduler.

## Open prevention (not part of this PR)
The 4 November rule that a migration and its lock row move in one lineage was written as prose and was not followed on 5 November. Enforcement must happen before merge, in the lane that already runs on the migration's own PR, not only in the post-merge BRAIN verification. This is left to the existing migration owner as an explicit decision.

## Independent gates
Protected Required and CodeQL, original BRAIN backend lane, original terminal closure and a new provider read of `schema_migrations`. Any migration applied before acceptance requires re-reading the provider history. A source-lock reconciliation proves no runtime, revenue or customer outcome.
