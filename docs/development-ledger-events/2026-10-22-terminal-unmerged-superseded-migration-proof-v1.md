# Development ledger · Terminal superseded migration coverage · 2026-10-22

- Canonical P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4681
- Obligation: `delivery|terminalizer|unmerged-superseded-migration-false-red|20261022-v1`
- Incident fingerprint reused: `brain|incident-observe|evidence-overwrite-and-crosswriter-runid-dup|20261022-v1`.
- Evidence: [failed terminal replay 39840439339](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39840439339), job 120039732278, `UNMERGED_SUPERSEDES_HAS_SUPABASE_MIGRATIONS:4686`. Preceding step returned `SUPABASE_MIGRATION_PROVIDER_READBACK_PROVEN:20261022173500` for #4697.
- Root cause: terminal lineage treats any unmerged predecessor SQL as unproven even if the same exact path was delivered by a merged successor and remains in protected main.
- Fix: same lineage, matched exact migration path + protected-main lookup with negative controls. Do not relax any missing/untrusted SQL, ACL, or migration readback.
- Required verification: new executable Node tests, existing supersession/identity tests, exact-head Required + CodeQL, protected merge, existing canonical controller replay of #4697, immutable terminal readback and skill projection.
- Current state: CANDIDATE, not source-live, terminal PROVEN or whole-BRAIN green. Original commercial cron timeout is separate #4215.
