# 12 november 2026 — officiële originele Supabase 835 / Git-lock 834

Original issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Independently verified source

Official Supabase project adhjwmvyoixzjtmiroln recorded **835** applied native migration IDs on 2026-11-12 19:33:40.399247+00. The last entry is exactly `20261112211000 / original_skipped_provider_reference_readback_handoff_v1`, whose original executable SQL exists already on protected main `6f5300cb52f64057e26d025ad52a39cf43301cdf`. The existing `supabase/migration-history.lock.json` had 834 entries. Independently compared every prior `(version,name)` pair: **834/834 match in original order**. Exactly one new official provider identity is missing from source.

PR #5681 Required/CodeQL/hosted native Preview passed, protected main `6f5300cb52f64057e26d025ad52a39cf43301cdf` merged, production migration 835 applied, live `pg_get_functiondef` and service-role ACL independently read; original `powerhouse_content_handoff_receipts_v1` pass returned 16/16 existing contradictory historical posts as `OVERDUE_PROVIDER_READBACK` with exact IDs, original owner, `OPEN` and unverified provider-readback. **No new post, send, measurement or downstream learning outcome was invented**.

Postmerge original [BRAIN run 43290248396](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43290248396) backend job 131434719446 returned 14 migration-lock inventory test failures, and terminal run #43290199939 correctly failed closed on BRAIN. These failures do not undo the live functional 16/16 repair but leave the terminal verification unproven.

## Bounded original writer repair

Append **only** the provider-confirmed 835th `version/name` to the original source lock, preserving every earlier record, source `project_ref`, existing SQL migration, native schema_migrations and runtime code. Update original ONE BRAIN regression, owner continuity skill and append-only ledger. No extra SQL migration, preview bypass, direct production write, second publisher, scheduler or charge. New source lock is admitted only via protected Required/CodeQL/native CI and exact main-merge. The original BRAIN verification-only/terminal flight for already-merged #5681 may then be attempted by the **same existing owner** without a second provider-create or historical replay. Do not claim green until that independent provider/consumer/terminal readback succeeds.

Regressie: `tests/brain-original-provider-835-immutable-lock-20261112.test.mjs`. Machinebron: `brain/learning/2026-11-12-original-provider-835-applied-lock-v1.json`.
