# 2026-10-06 — Supabase migration repair empty-remote parser v3

- Obligation: #3742
- Trusted run: 37425004020
- Database transport: successful on latest attempt
- Production mutation: not reached
- Proven CLI representation: local-only baseline remote cell is rendered as \` \`
- Failure: `REMOTE_ONLY_OR_IDENTITY_DRIFT`
- Correction: second trim after presentation-backtick removal in both parity parsers
- Invariants retained: exact four-version allowlist, supported Supabase CLI repair only, no direct writes to `supabase_migrations`
