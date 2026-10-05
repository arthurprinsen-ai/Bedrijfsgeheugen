# GitHub OIDC database transport for #3742

The trusted Supabase migration-repair workflow no longer depends on absent GitHub Supabase credentials.

A dedicated Supabase Edge Function verifies GitHub's OIDC token against the exact repository, `refs/heads/main`, exact repair workflow reference, and a dedicated audience. Only after those claims match does it expose the function runtime's built-in `SUPABASE_DB_URL` to that trusted job. The workflow masks the value immediately and uses it only with the official Supabase CLI `migration list --db-url` and `migration repair --status applied --db-url` commands.

The four-version allowlist, effect-evidence requirement, pre-repair exact-drift test, post-repair zero-drift test, exact-head recovery lease and fail-closed terminal contract are unchanged. No direct writes to `supabase_migrations` are introduced.
