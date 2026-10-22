# Append-only development event — 2026-10-22

- Fingerprint: `delivery|terminalizer|supabase-sql-tests-misclassified-runtime|20261022-v1`
- Parent obligation: [#4681](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4681); protected-merged source [#4697](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4697)
- Observed: [run #39833808183](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39833808183), job 120016707966, `UNWIRED_NON_NETLIFY_RUNTIME_READBACK` at `supabase/tests/brain_failure_observe_semantic_recovery_v1.sql`
- Causal contract: `brain/contracts/production-readback-v1.json` omitted the narrow `supabase/tests/` prefix despite `tests/` being verifier-only.
- Recovery candidate: add only `supabase/tests/` to the canonical path classifier; protected production migrations and Edge runtime unchanged.
- Safety regression: `tests/brain-terminalizer-quality-surface-governance-v1.test.mjs`; positive test fixture, negative migration/Edge/config/unknown backend.
- Readback: classifier examples evaluated locally in delivery tool preflight; **CI, protected merge, provider runtime proof and terminal replay not yet achieved** at event authoring time. Do not promote to PROVEN without real exact-source receipts.
- Next safe action: existing protected native CI and canonical postmerge replay; one incident owner, no added scheduler/storage.
