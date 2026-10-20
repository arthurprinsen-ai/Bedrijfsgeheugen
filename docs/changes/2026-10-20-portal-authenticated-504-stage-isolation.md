# 2026-10-20 — authenticated entrepreneur data 504 stage isolation (P0 #4215)

## Provider evidence, not inferred success
- Netlify GET /api/portal-ondernemersdata responded HTTP 504 after 30–31s on 2026-10-20; synthetic authenticated release proof also failed. Production app DOM/browser success does not prove authenticated tenant data.
- Supabase Edge portal-state-eu showed HTTP 500 after ~90s, while other actions completed quickly. Postgres emitted statement timeouts and connection resets; cross-system DB contention is suspected but the precise slow query is not yet proved.
- Existing action entrepreneur_intelligence performs ten lazy reads in groups of max three from Supabase PostgREST. One outstanding stage can block the combined response.

## Read-stage diagnostic change in canonical function
The existing `bounded-reads.js` now prints only anonymous 8-character request-local trace, fixed stage label and milliseconds for reads exceeding 2s or failing. No tenant ID, SQL, tokens, headers, customer rows or error details may be logged. Full fail-closed promise semantics remain unchanged.

**Stage order**: 1 SOURCES / 2 PUBLICATIONS / 3 EXTERNAL_SIGNALS / 4 DOMAIN_REGISTRY / 5 SOURCE_CATALOG / 6 SIGNAL_PROJECTION / 7 COMPANY_IMPACT / 8 CANONICAL_ACTIONS / 9 TENANT_ACTIONS / 10 INTELLIGENCE_SNAPSHOT.

## Acceptance
1. Protected Required/CodeQL and relevant Edge tests green on exact HEAD and deploy source hash.
2. On deployed Edge function, capture `PORTAL_READ_SLOW` and/or `PORTAL_READ_FAILED` for authenticated test calls, correlate by anonymous trace ID; report real bottleneck (view/plan/pool wait), not guessed query.
3. Investigate Postgres statement timeout and Supavisor connection availability; avoid repeat/unbounded retries, global timeout increases, unconditional cron disable, or a second scheduler.
4. Optimize proven query plan/index/concurrency, repeat during typical scheduler pressure; verify real data with source timestamps.
5. Independent signed Netlify API returns 200 with tenant-bound data for two isolated tenants; write → Brain ACK → intelligence recompute → portal readback and Source Universe freshness pass. Otherwise #4215 remains OPEN.

## Status
Diagnostic-only PR; **not production accepted**, not full end-to-end fix. Branch does not change access control, claim fake computed outcomes or replace missing data with zero.
