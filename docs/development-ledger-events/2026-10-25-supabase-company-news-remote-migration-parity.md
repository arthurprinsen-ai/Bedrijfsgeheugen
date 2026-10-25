# Append-only development ledger — 2026-10-25 — Supabase provider remote-only migration identity

Parent P0 #4198; original recovered business-news code PR #4867; subsequently merged provider-proof SQL PR #4879.

Production Supabase native main-branch deployment on 25 Oct 2026 11:42:42 UTC failed with `Remote migration versions not found in local migrations directory`; original Git code and production ledger differ by remote-only historical version `20261025112658`. Independent read-only proof: its recorded SQL is byte-for-byte identical to reviewed Git migration `20261025101500` (4,087 bytes); current real production functions and grants still match that source. Local pending commercial status version `20261025110200` must not be marked applied yet.

Same release authority, no new sender/scheduler or production writer: restore the actual historical SQL under its already-recorded version in Git; preserve regressions, exact-head Required + CodeQL + native preview, protected merge, production Supabase Git readback. Prevention: reject remote-only versions in deploy preflight; never race native Git migration release with direct manual apply. No artificial Instagram, customer or paid-order evidence.

## Follow-up: preserve chronological order of never-applied publisher-proof SQL

Supabase applies pending migrations in timestamp order. Production already records `20261025112658`, whereas the independently verified, never-deployed publisher-proof migration from merged #4879 was named `20261025110200`. After reconstructing the already-applied remote history, that earlier timestamp would remain out of order. On this same protected repair PR, the **identical 4,687-byte SQL** has therefore been re-versioned as `20261025130000_commercial_daily_provider_evidence_reconciliation_after_history_parity.sql`, and its regression test now reads the new path. The previously unapplied `20261025110200` file has been retired from Git, **not** marked applied or altered in production. The migration's function semantics and ACL remain unchanged. Native Supabase preview, Required, CodeQL, protected merge, and real production readback are still mandatory.
