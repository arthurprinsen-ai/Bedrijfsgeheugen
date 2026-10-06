# Supabase migration repair transport recovery — #3742

Trusted-main repair run 37425004020 reached the OIDC-authenticated Supavisor session transport but lost the database connection before the initial migration-list readback. PostgreSQL provider logs showed SQLSTATE 08006 / client-loss events in the same window while the project remained ACTIVE_HEALTHY.

This change adds bounded reconnects only to the read-only `supabase migration list --db-url` calls before and after repair. The exact four-version allowlist and the official `supabase migration repair --status applied --db-url` mutation are unchanged. The mutation is deliberately not automatically retried.

Terminal acceptance remains unchanged: provider zero-drift readback, force-with-lease update of #3766, fresh exact-HEAD checks, protected merge, and post-merge production readback.
