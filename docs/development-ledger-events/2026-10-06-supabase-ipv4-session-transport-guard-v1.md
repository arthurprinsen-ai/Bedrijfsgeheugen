# Supabase IPv4 session transport guard — development ledger

Date: 2026-10-06
Obligation: supabase-ipv4-session-transport-guard-3742-v1
Scope: trusted Supabase migration-repair transport in GitHub Actions

Observed failure:
- the direct Supabase Postgres endpoint is IPv6 by default;
- the GitHub-hosted repair path cannot rely on IPv6 reachability;
- retrying the same direct endpoint preserves the network-family failure.

Structural recovery:
- canonical OIDC bridge source is repository-owned;
- the bridge rewrites the credential source to the shared Supavisor session endpoint on port 5432;
- CI requires the exact pooler host, project-qualified username, sslmode=require and transport marker;
- direct db.<project>.supabase.co transport is rejected before any migration mutation;
- the runner proves IPv4 DNS resolution before invoking the Supabase CLI;
- function-only config.toml changes are explicitly classified as provider database-preview N/A without weakening database-relevant preview enforcement.

Verification:
- regression contracts cover transport identity and preview applicability;
- the bridge is registered as a required quality surface;
- learning canonicalization is bound to a brain historical-replay test;
- protected merge remains gated by exact-HEAD Required test, CodeQL and Supabase Preview Applicability.
