# 2026-10-19 — External signal 432 quota incident

- Root cause: Tavily usage cap causes persistent 432 across all 3 daily external topics. This is not a retryable transient outage.
- Verified alternative: DataForSEO live organic Google SERP account works using existing connected provider.
- Repair candidate: protected existing `bg-externe-signalen` function source and add quota-safe DataForSEO failover without parallel cron.
- Guardrails: bounded batches and timeouts, no paid ads, no unsupported publish dates, source authority and timestamp evidence required, no synthetic green.
- Acceptance: Required CI/CodeQL, protected merge, exact production deployment/readback, actual function invocation and independent source freshness; if quota and DataForSEO both fail, retain RED and log error.
