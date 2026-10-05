# Development ledger — Supabase migration repair CLI parser #3742 v1

- Date: 2026-10-05
- Parent obligation: #3742
- Trusted workflow run: 37354534547, attempt 2
- OIDC acquisition: success
- IPv4 Supavisor session-pooler connection: success
- Provider mutation: not started
- Failure: pre-repair parser returned empty drift because CLI table cells were wrapped in backticks
- Correction: normalize only presentation backticks before exact migration-version comparison
- Safety unchanged: exact four-version allowlist, no remote-only entries, official Supabase CLI repair only, post-repair zero drift, force-with-lease #3766 update
