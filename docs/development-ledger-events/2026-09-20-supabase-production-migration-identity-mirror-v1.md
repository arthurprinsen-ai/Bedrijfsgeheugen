# Development ledger — Supabase production migration identity mirror

- Date: 2026-09-20
- Obligation: `supabase-production-migration-identity-mirror-v1`
- Incident: repo used `20260920111000_admin_composio_key_onboarding.sql`, while production recorded `20260920112118_admin_composio_key_onboarding`.
- Runtime state: RPC applied and least-privilege verified; only migration identity drift remained.
- Resolution: repository migration renamed to exact production version; stale filename removed.
- Rule: never mutate production history to fit stale repo metadata; reconcile repo to exact applied version/name.
