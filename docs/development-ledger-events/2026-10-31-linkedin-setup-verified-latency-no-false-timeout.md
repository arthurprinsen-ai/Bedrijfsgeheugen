# Event — 2026-10-31 LinkedIn original setup child timeout

- Source: exact original ONE BRAIN `content-closed-loop:2026-10-31` 12:49 UTC, `powerhouse-composio-linkedin-setup` falsely timed_out true with HTTP 0.
- Independent provider: Supabase `function_edge_logs`, 12:48:21.344 UTC, original Edge v540, HTTP200 and 21,182ms. Parent allowed 8,000ms; no parent-side readiness proof could arrive within budget.
- Code candidate: original `powerhouse-content-loop/index.ts` `CHILD_TIMEOUTS` setup audit 8,000 → 30,000ms; original 240s exclusive lease and all other child budgets unchanged.
- Existing source audit still `COMPANY_AUTH_REQUIRED`, fresh OAuth company proof `RESET_UNVERIFIED`. No provider ID and no authorized account recovery created by this patch.
- Regression: `tests/brain-linkedin-original-setup-timeout-budget-20261031.test.mjs`. Existing ONE BRAIN, original self-improvement skill, AGENTS and human docs included. No added workers/schedulers.
- Evidence maturity: OBSERVED, no fabricated natural post-deployment successful child call or publication. Protected CI, merge, original Edge source deploy/parity, next natural run remain required.
