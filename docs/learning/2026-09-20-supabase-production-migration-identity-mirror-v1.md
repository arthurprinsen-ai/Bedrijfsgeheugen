# Supabase migration identity must mirror production

For migrations that are already applied in production, the immutable production migration version/name is the canonical identity.

The Composio admin onboarding migration was functionally present in production, but Supabase registered it as `20260920112118_admin_composio_key_onboarding` while the repository still used `20260920111000_admin_composio_key_onboarding.sql`.

The repository now mirrors the exact production identity. Future terminal closure must compare both version and name and fail closed on drift.
