# Development ledger — Supabase migration repair blank remote cell

- Obligation: #3742
- Canonical recovery owner: #3766
- Source evidence: trusted-main run 37425004020 attempt 4
- Observed failure: four expected local-only versions were rendered with blank remote cells; parser treated the post-backtick value as a non-empty single space.
- Change: post-normalization trim in both migration-list parsers.
- Preserved invariants: exact four-version allowlist, supported `supabase migration repair --status applied --db-url`, no direct schema_migrations writes, post-repair zero drift, force-with-lease update of #3766.
- Terminal state: not claimed by this change.
