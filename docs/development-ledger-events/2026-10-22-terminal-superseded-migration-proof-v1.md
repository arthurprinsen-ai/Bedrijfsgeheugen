# 2026-10-22 terminal supersession/migration identity failure

- Fingerprint: `delivery|terminal-closure|retired-superseded-migration-lineage|20261022-v1` under canonical P0 #4681.
- Immutable failure: run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39840439339 job 120039732278, failure at step 11 `UNMERGED_SUPERSEDES_HAS_SUPABASE_MIGRATIONS:4686:...`.
- Actual lineage: closed unmerged retired #4686; protected merged #4697, same exact `supabase/migrations/20261022173500_brain_failure_observe_semantic_guard_v1.sql`, different historical draft SQL blobs; earlier provider/APPLIED and runtime proof independently observed.
- Scoped remediation: exact direct owner link + retired state + successor changed-path Git-blob identity + current main parity, preserving mandatory live provider, ACL, tenant and Brain terminal evidence. Historical bytes are retained.
- Regression: `tests/brain-terminal-migration-identity-v1.test.mjs`, positive #4686→#4697 deliberate-content-change; negatives for unrelated path/version, active/different owner, incorrect SHA and current main drift.
- This is a **candidate**, not green or live terminal success. Proof requires exact head Required/CodeQL, protected merge, then one existing-authority terminal readback. Cron #46 revenue remains separate #4215.
