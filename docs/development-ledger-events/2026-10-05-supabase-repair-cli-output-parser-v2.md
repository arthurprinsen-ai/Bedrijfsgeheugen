# 2026-10-05 — Supabase repair CLI parser recovery

Obligation: supabase-repair-cli-output-parser-v2
Issue: #3742
Failed trusted repair run: 37354534547
Failed job: 111914773692

Observed:
- OIDC database transport acquisition succeeded.
- Supabase CLI showed four local-only replay versions.
- parser returned an empty drift set because CLI backticks were not normalized.
- no production migration-history mutation occurred in the failed run.

Action:
- normalize backticks before version matching;
- retain exact allowlist and supported provider repair semantics;
- add regression coverage for db-url output parsing.

Production ledger remains 564 until the corrected trusted-main repair succeeds.
