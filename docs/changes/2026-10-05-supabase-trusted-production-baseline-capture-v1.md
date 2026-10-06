# Trusted Supabase production baseline capture for #3742

Issue #3742 cannot be closed from an ad-hoc catalog reconstruction. The recovery now has a dedicated trusted control-plane lane that runs from default-branch workflow code only.

The lane uses the official Supabase CLI to capture the production schema, roles, migration-history schema/data, and `supabase migration list --linked`. It computes SHA-256 hashes, emits a manifest, verifies the recovery PR has not moved, and writes the baseline to the exact recovery branch using a force-with-lease push.

Production credentials are not made available to pull-request workflow code. The trusted lane performs no production schema/data DDL/DML. It may perform only the exact four candidate-declared migration-history repairs whose production effects are already evidenced, using `supabase migration repair --linked --status applied`; this changes tracking only and never re-executes their SQL. The repaired remote ledger is read back before any evidence is written to the recovery branch.

This closes the tooling-design gap only. Issue #3742 remains fail-closed until the captured baseline is replayed successfully in a fresh environment, remote/local migration parity is proven on the resulting exact head, all required checks pass, the protected merge completes, and post-merge production readback is green.


The repair set is fail-closed and fixed to `20260920101150`, `20260920102450`, `20260925080500`, and `20261005133951`. Reruns are idempotent: an already matched local/remote version is not repaired again. Exact version/name rows must appear in the official migration-history dump before the recovery lock can advance to `REPAIRED_APPLIED_VERIFIED`.

Before repair, trusted main workflow code independently re-verifies all four production effects with read-only SQL. Candidate-provided SQL is never executed against production; an unknown or additional pending repair fails closed until the trusted allowlist and proof are reviewed.
