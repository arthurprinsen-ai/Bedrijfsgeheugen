# Supabase migration identity must mirror production

For migrations already applied in production, immutable production migration history is authoritative.

The Composio onboarding lineage contains two applied versions with the same semantic name: `20260920112118_admin_composio_key_onboarding` (initial apply) and `20260920112436_admin_composio_key_onboarding` (security recovery). The latter contains the explicit `REVOKE EXECUTE` contract and is the latest effective production identity matching the current runtime.

The repository therefore mirrors `20260920112436_admin_composio_key_onboarding.sql`. Future terminal closure must not stop at the first matching migration name: it must compare version, name, and effective contract semantics and fail closed on drift.
