# Development ledger — Instagram migration syntax
Date: 2026-10-10
Obligation-ID: p0-4198-instagram-migration-terminator-20261010
Parent P0: #4198
Predecessor: PR #4312
Observed: Supabase apply_migration returned SQLSTATE 42601, syntax error at REVOKE because function terminator was missing.
Action: Correct the existing SQL migration through protected PR #4313; keep original post-function EXECUTE revocation/least privilege.
Safety: no additional publication writer, no auto-success, no invented media proof, no bypass of CI or RLS.
Readback criteria: Postgres function body includes in-flight asset preservation; anon/authenticated cannot execute; media manifest survives ensure call; Instagram media gate remains fail-closed.
