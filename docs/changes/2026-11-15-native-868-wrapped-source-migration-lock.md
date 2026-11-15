# Native applied migration 868 — exact original GitOps history lock

**Date:** 15 Nov 2026. **Original P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. **Original source release:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5852.

## Provider proof, no guessed migration
Protected original `main` at `2aa0866c5975def2e6833023b39351b53c1fdfca` contains executable original migration `supabase/migrations/20261115121500_original_wrapped_serp_source_dispatch_wakeup_v1.sql`. Protected original `supabase/migration-history.lock.json` held exactly 867 applied entries. Independent native `supabase_migrations.schema_migrations` from production project `adhjwmvyoixzjtmiroln` returned exactly **868** applied entries, newest exact version `20261115121500` / name `original_wrapped_serp_source_dispatch_wakeup_v1`.

An exact native SQL FULL OUTER pairwise readback verified **all 867 source-lock version+name pairs are applied and match**, zero source-only/mismatched pairs, and **exactly one** native-only version, the original 868th. This was checked 2026-11-15T11:42:57.174Z. No source-only or synthetic migration may be marked as applied.

## Same original owner, source-only correction
Append only the exact 868th already-applied native version/name, preserve all 867 existing source identities, update captured provider readback timestamp; **do not reapply SQL**, alter schema/function permissions, create an Edge worker, cron, sender, login or paid Supabase preview branch. The original migration source remains untouched. This corrects protected CI migration inventory parity (original stale guard `867 !== 868` blocked separate #5851 despite no database modifications).

Machine learning, human explanation and append-only ledger in same four-file source-only PR. Exact-head Required, CodeQL, migration source replay tests, Supabase provider preview (if required by existing original guard), protected main merge and independent native 868/868 readback must be successful before declaring GitOps history green. No claim of commercial email/Instagram/revenue completion from this provenance fix.
