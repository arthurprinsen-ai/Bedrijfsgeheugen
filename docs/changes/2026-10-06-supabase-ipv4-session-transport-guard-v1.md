# Supabase IPv4 session transport guard

The direct Supabase Postgres endpoint for project `adhjwmvyoixzjtmiroln` is an IPv6 route. GitHub-hosted Actions cannot rely on that route, so retrying the direct endpoint is not a valid recovery strategy.

The trusted migration-repair path is now structurally pinned to the shared Supavisor session pooler:

- canonical host: `aws-0-eu-central-1.pooler.supabase.com`
- port: `5432` (session mode)
- database user: `postgres.adhjwmvyoixzjtmiroln`
- TLS: `sslmode=require`
- transport contract: `supavisor-session-ipv4`

The production OIDC bridge source is canonicalized in `supabase/functions/supabase-migration-repair-bridge/`. The GitHub workflow rejects any returned transport that deviates from the canonical host, port, username, TLS mode, or transport marker, explicitly rejects the direct `db.<project>.supabase.co` route, and proves IPv4 DNS resolution with `getent ahostsv4` before invoking the Supabase CLI.

This makes an IPv6 regression fail closed before any migration-history mutation is attempted.
