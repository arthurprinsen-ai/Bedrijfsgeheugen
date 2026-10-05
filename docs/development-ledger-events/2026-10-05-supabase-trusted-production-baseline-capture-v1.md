# Supabase trusted production baseline capture v1

- Date: 2026-10-05
- Obligation: supabase-production-baseline-capture-v1
- Issue: #3742
- Delivery lane: backend
- Candidate type: recovery
- Authority: trusted default-branch GitHub Actions workflow
- Production schema/data mutation: none
- Production migration-history tracking mutation: bounded supported repair of exactly three effect-verified versions

## Change

Adds the trusted control-plane lane that captures the official linked Supabase production schema and migration ledger with the Supabase CLI, SHA-256 binds the evidence, leases the exact canonical recovery HEAD, and writes the immutable baseline only to that recovery branch.

The candidate resolver selects exactly one highest-version open `supabase-migration-history-canonical-vN` obligation and fails closed when that authority is ambiguous. After the baseline commit advances the recovery branch, the workflow advances the recovery PR `Writer-Lease-Head` to the new exact HEAD so delivery admission cannot accept stale metadata.

## Invariants

- Production credentials are available only to trusted main workflow code.
- Production schema/data is read-only; only supported migration-history tracking repair for the exact reviewed three versions is permitted.
- No direct SQL write to `supabase_migrations`; tracking reconciliation uses only `supabase migration repair --status applied`.
- No hand-built `pg_catalog` reconstruction.
- Recovery write uses exact-head `--force-with-lease`.
- Multiple highest-version canonical recoveries fail closed.
- Baseline evidence alone does not close #3742.
- Fresh replay, exact-head gates, protected merge, and post-merge production readback remain mandatory.

- Pre-repair drift must be exactly the three replay baselines and zero remote-only.
- Post-repair `supabase migration list --linked` must have zero drift before evidence writeback.
