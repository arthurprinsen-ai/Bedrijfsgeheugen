# Development ledger — 2026-10-22 — terminalizer regression classification

Fingerprint: `delivery|terminalizer|sql-regression-classified-as-runtime|20261022-v1`.
Owner: existing Powerhouse delivery-control-plane.
Evidence: merged PR #4697, terminalizer run 39833808183, job 120016707966, rejected rollback-only `supabase/tests/brain_failure_observe_semantic_recovery_v1.sql`.
Root cause: canonical `brain/contracts/production-readback-v1.json` verifierOnlyPrefixes did not include `supabase/tests/`.
Correction: scoped test-only prefix; no terminalizer workflow change.
Regression: `tests/brain-production-release-readback-scope.test.mjs` positive SQL verifier-only and negative migration/Edge/Netlify/unknown-runtime canaries. No broad supabase/* bypass.
Historical producer incident, raw occurrences and promotion proof are preserved in canonical Brain. No second scheduler or error memory.
Status: CANDIDATE; exact-head Required, CodeQL, protected merge, postmerge terminalizer success, and genuine Supabase provider/migration readback required before PROVEN.
