# Development ledger — social publisher fail-closed retry and reviewer freshness

- Date: 2026-10-15
- Obligation-ID: `powerhouse-social-review-transient-retry-20261015`
- Observed provider truth: no personal or company LinkedIn publication, no Instagram publication and no authorized email or LinkedIn DM delivery today
- Root source: `bg-pre-publish-review` selects confidence-ranked top 24 active rules, newest 2026-10-09, even though 2026-10-15 high-confidence active rules exist outside that top 24
- Exact failure: HTTP 503 with `RULE_CONTEXT_STALE` possible under unchanged 96-hour freshness, mapped by `powerhouse-social-publisher` to permanent `blocked`; daily publisher only processes `content_ready`
- Repair: selection by recency among active rules with confidence >= 0.85; do not lower age gate or alter independently VERIFIED identity contract
- Repair: only transient HTTP statuses or network errors retain the original `content_ready` claim with `BLOCKED` obligation; provider dispatch remains forbidden without 200 + PASS + exact hash
- Regression: `tests/brain-social-prepublish-retry.test.mjs`
- Unresolved external boundaries: SalesRobot subscription expired and campaign paused, LinkedIn company OAuth scope 403, no authorized email executor, Instagram final media evidence, no LinkedIn company artifact
- Release status: source commit in PR #4379, protected CI and CodeQL plus protected merge and both Supabase Edge Function deployments pending; no fabricated delivery success
- Readback criterion: exact production Edge Function versions, identical original content, provider-authenticated external ID/permalink and downstream status.

See: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4379
