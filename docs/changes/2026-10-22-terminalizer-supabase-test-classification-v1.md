# Terminalizer: SQL test-fixture paths must not masquerade as runtime

Fingerprint: `delivery|terminalizer|supabase-sql-tests-misclassified-runtime|20261022-v1`. Canonical parent [#4681](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4681).

## Actual failure
After source PR [#4697](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4697) merged on 22 October 2026, [terminalizer run #39833808183](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39833808183), job 120016707966, aborted with `UNWIRED_NON_NETLIFY_RUNTIME_READBACK` for `supabase/tests/brain_failure_observe_semantic_recovery_v1.sql`. The existing canonical production-readback contract lacked `supabase/tests/` in `verifierOnlyPrefixes`. The merged migration remains subject to an independent provider application check; its state is not implied by this correction.

## Narrow causal repair and safety
Add only `supabase/tests/` to the existing verifier-only prefix collection. Keep `supabase/migrations/*` on mandatory provider-applied migration readback, `supabase/functions/*` and `supabase/config.toml` on dedicated provider scope, and unknown backend paths fail-closed. No skipped Required test/CodeQL, no synthetic green status, new scheduler, parallel error registry, provider DDL, user-facing runtime change or premature production assertion.

Executable regression: `node --test tests/brain-terminalizer-quality-surface-governance-v1.test.mjs` (positive SQL test fixture; negative migration, Edge, config and unknown path; existing workflow markers preserved).

## Terminal acceptance
Fresh exact-head Required and CodeQL; protected native merge; one owner-authorized replay of #4697 via the **existing** Powerhouse Obligation Terminalizer; independent production migration/function/ACL/semantic-incident readback and existing canonical Brain/skill/ledger projection. Until then **CANDIDATE, NOT PRODUCTION GREEN**.
