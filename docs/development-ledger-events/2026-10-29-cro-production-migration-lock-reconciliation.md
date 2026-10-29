# 29 oktober — Revenue Learning migrate-history lock source reconciliation

- **Owner:** canonical Powerhouse Supabase/source migration writer.
- **Fingerprint:** `supabase|revenue-learning|migration-history-lock-stale-after-production-20261029` (existing `public.brain_failure_registry`, OBSERVED).
- **Observed workflow failure:** GitHub `40919925385`, 91/92 passing, `supabase-migration-history-integrity.test.mjs` fails on five local-only versions. Bounded rerun also fails from identical stale source, so retrying cannot repair it.
- **Readback source:** real `supabase_migrations.schema_migrations` 2026-10-29 17:20 UTC; exact five [20261029122836,20261029125100,20261029125607,20261029174600,20261029174700] versions+names validated. Actual Postgres contains both new CRO views. Protected backend #5143 main `3ce83006...` and Netlify `6ae37fb...` were independently verified.
- **Repair action:** append exact source identities to `supabase/migration-history.lock.json` (774→779); no SQL replay, RLS change, API key, cron or synthetic lead.
- **Regression:** `tests/brain-cro-production-migration-lock-20261029.test.mjs`; existing source integrity test; exact-head Required/BRAIN/CodeQL and fresh `Revenue Learning` push-run on merged main are required.
- **Human documentation:** `docs/changes/2026-10-29-cro-production-migration-lock-reconciliation.md`.
- **Carry-forward:** protect live consented event→durable queue→Supabase ID→rollup, portal owner-only evidence and independent partner/billing readback. Neither a passing test nor 0 leads means success in paid conversions.
- **Outcome status:** CANDIDATE_NOT_MERGED; CI_RECOVERY_UNVERIFIED; REAL_ORDER_OUTCOME_UNVERIFIED until actual provider and main readback.
