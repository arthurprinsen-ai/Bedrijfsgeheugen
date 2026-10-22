# Append-only delivery incident / SQL verifier classification — 2026-10-22

- **Fingerprint:** `delivery|terminalizer|supabase-sql-test-fixture-unwired-readback|20261022-v1`
- **Source incident:** existing P0 [#4681](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4681), protected PR [#4697](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4697) merged at `d41950ed3eed1758134fd82281c1023c1b6a22f5`.
- **Failure evidence:** GitHub terminalizer [run 39833808183](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39833808183), job `120016707966`, error `UNWIRED_NON_NETLIFY_RUNTIME_READBACK`, listed `supabase/tests/brain_failure_observe_semantic_recovery_v1.sql`, exit 78. A real classification failure, not a failed SQL migration.
- **Independent production proof:** Supabase migration `20261022173500` installed; live function md5 `3f5d19e556f5425630cf80a5e341a02b`; `anon` and `authenticated` cannot execute observe/promote; service-role can.
- **Prior analogous prevention:** #4089 exact verifier-only migration-history lock, no broad Supabase exemptions.
- **Source correction candidate:** allowlist one exact SQL rollback-test path in existing canonical production-readback contract; regression positive exact fixture and negative unknown/migrations/Edge. Preserve `APPLIED` migration provider gate and fail-closed unknown classification.
- **Evidence status:** source/contract candidate, NOT yet CI verified or production/live terminal closure. Do not close #4681 or replace historical evidence.
- **Next safe owner action:** exact-head Required+CodeQL; protected merge; existing terminalizer owner must re-evaluate original #4697 production runtime/migration/ACL/skill closure from provider truth without faking or bypassing any required check.
