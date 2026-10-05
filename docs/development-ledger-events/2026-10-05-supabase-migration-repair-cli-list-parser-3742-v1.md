# 2026-10-05 — #3742 Supabase CLI migration-list parser recovery

Observed evidence: trusted-main run 37354534547, attempt 3.

- OIDC acquisition: success.
- Supavisor session IPv4 transport: success.
- `supabase migration list --db-url`: success.
- Parser failure: `UNEXPECTED_PRE_REPAIR_DRIFT:[]`.
- Root cause: CLI output wraps version cells in backticks.
- Production mutation: none; repair command was not reached.
- Production ledger therefore remained 564.

Recovery normalizes CLI presentation only and preserves the exact four-version repair allowlist and zero-drift postcondition.
