# Supabase migration terminal-readback reconciliation — 25 Sep 2026

Fingerprint: `supabase|migration-readback|unique-name-reconcile|v2`.

## Incident

PR #2886 reached protected merge and production Edge Function readback, but terminal closure failed with `MIGRATION_LEDGER_IDENTITY_MISMATCH`. The governance migration existed in production under Supabase migration version `20260925074007`, while Git expected `20260925073300`; the stable migration name was identical.

## Fix

`powerhouse_supabase_migration_readback_v1` now returns contract v2:

- exact `version + name` remains the preferred proof;
- if exact version is absent, one and only one applied migration with the same stable name may reconcile;
- duplicate same-name candidates fail closed as `AMBIGUOUS_NAME`;
- evidence records both `expected_version` and `applied_version` plus `match_mode`.

This prevents a false terminal blocker without weakening migration identity proof.

## Delivery invariant

Terminal delivery still requires protected merge, production/provider readback, outcome, learning/prevention, skill projection, canonical current-state/dashboard writeback and read-after-write. Pending work is never returned to the user as a normal final handoff.
