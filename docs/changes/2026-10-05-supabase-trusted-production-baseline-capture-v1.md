# Trusted Supabase production baseline capture for #3742

Issue #3742 cannot be closed from an ad-hoc catalog reconstruction. The recovery now has a dedicated trusted control-plane lane that runs from default-branch workflow code only.

The lane uses the official Supabase CLI to capture the production schema, roles, migration-history schema/data, and `supabase migration list --linked`. It computes SHA-256 hashes, emits a manifest, verifies the recovery PR has not moved, and writes the baseline to the exact recovery branch using a force-with-lease push.

Production credentials are not made available to pull-request workflow code. The baseline workflow performs no production DDL/DML writes.

This closes the tooling-design gap only. Issue #3742 remains fail-closed until the captured baseline is replayed successfully in a fresh environment, remote/local migration parity is proven on the resulting exact head, all required checks pass, the protected merge completes, and post-merge production readback is green.
