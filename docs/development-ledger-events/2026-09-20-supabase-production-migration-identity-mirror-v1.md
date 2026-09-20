# Development ledger — Supabase production migration identity mirror

- Date: 2026-09-20
- Obligation: `supabase-production-migration-identity-mirror-v1`
- Incident: the repository first mirrored production version `20260920112118`, but provider readback showed a later applied security-recovery version `20260920112436` with the same migration name.
- Runtime state: latest effective production SQL uses explicit `REVOKE EXECUTE`; only `postgres` and `service_role` retain EXECUTE.
- Resolution: repository migration moved to `20260920112436_admin_composio_key_onboarding.sql`; stale `20260920111000` and `20260920112118` filenames are rejected by regression tests.
- Rule: when duplicate semantic migration names exist in provider history, reconcile to the latest effective applied version matching the current production contract; never mutate provider history to fit repository metadata.
