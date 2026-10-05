# 2026-10-05 — One commercial loop migration history parity

- Type: RECOVERY / SUPABASE_MIGRATION_IDENTITY
- Production migration version: `20261005144606`
- Production migration name: `powerhouse_one_commercial_closed_loop_v2`
- Runtime contract: `powerhouse-one-commercial-closed-loop-v2`
- Runtime readback after PR #3739 merge: `actioned / VERIFIED / confidence 1`
- Gap: GitHub filename used version `20261005161500`, which could make a future migration planner treat the already-live migration as unapplied.
- Correction: rename the repository migration to `supabase/migrations/20261005144606_powerhouse_one_commercial_closed_loop_v2.sql` without reapplying DDL.
- Safety: no production data mutation; this is repository-history canonicalization only.
- Terminal rule: exact-HEAD checkset → merge → repository/main readback. Production runtime was already verified post-merge.

- Workflow registration: the recovery is not terminal until a synchronize event registers the full exact-HEAD GitHub Actions checkset; Supabase Preview alone is insufficient.
