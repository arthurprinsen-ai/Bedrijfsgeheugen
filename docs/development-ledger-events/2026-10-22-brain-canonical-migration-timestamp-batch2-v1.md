# Additional BRAIN canonical migration timestamps — 2026-10-22

- Obligation: ci-brain-canonical-timestamp-oracle-batch2-20261022; P0 #3742; portal #4215.
- Baseline: full BRAIN 39755490943, 354/3552 failed before this branch (different commit).
- Change: six historical BRAIN test modules reference the actual canonical migration versions, not nonexisting planned-timestamp aliases.
- Proof: original and current SQL immutable Git blob SHAs verified; original test reconstructed by reversing just one source path per file; original assertions unchanged.
- Regression: tests/brain-canonical-migration-timestamp-batch2-20261022.test.mjs, six source-identity tests. Original suites remain mandatory in full backend BRAIN, not skipped.
- No schema/RLS/tenant authorization/provider/cron/SQL migrations/production changes.
- Block until exact-HEAD Required+CodeQL, complete BRAIN zero failures, Supabase #3742 migration parity and genuine portal #4215 tenant isolation.
