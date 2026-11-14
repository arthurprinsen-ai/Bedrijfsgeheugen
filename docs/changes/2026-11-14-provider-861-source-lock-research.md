# 2026-11-14 — provider 861 exact source-history reconciliation

Original P0 #4198. Original Supabase source-lock writer, not another scheduler or business research agent.

Independent native project readback at 2026-11-14T18:51:36.129743Z: 861 actually applied (version,name) rows. Original Git `supabase/migration-history.lock.json` has 860; every existing 860 matches the native provider row, **zero** prefix conflicts. Only the already-applied `20261114210000 original_public_work_email_source_priming_v1` is absent.

The original protected research source PR [#5792](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5792) is merged and provider-applied. This repair appends exactly its actual production identity to the existing source lock, preserves all historical identities, and documents the observed UTC time. No SQL execution, new migration, cron, email address write, vendor API or output outcome. The dependent candidate receiver PR [#5787](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5787) remains unmerged until exact-head tests, CodeQL, native preview and source/consumer readback succeed. No temporary bypass and no synthetic PROCESSED or Gmail-send proof.

Failure class MIGRATION_LOCK_DRIFT; canonical ONE BRAIN learning record `brain/learning/2026-11-14-provider-861-source-lock-research-v1.json`, regression `tests/brain-supabase-migration-lock-provider-20261029.test.mjs`. Original owner responsible for provider-only append and protected merge.
