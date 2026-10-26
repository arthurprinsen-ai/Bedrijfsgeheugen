# Bounded DataForSEO timeout recovery (2026-10-19)

Existing PR #4514 merged and production `bg-externe-signalen` v12 confirmed exact provider failover under real Tavily HTTP 432. Two real probes demonstrated DataForSEO successful organic searches but intermittent `UPSTREAM_TIMEOUT` for individual topics: #8104 (2/3), #8107 (1/3). The fallback had incorrectly inherited Tavily's 12-second network deadline.

**Fix:** Separate provider timing parameters in the **existing** Edge Function: Tavily 12,000ms, DataForSEO 35,000ms. Three topics remain a single parallel bounded batch under the existing scheduler `bg_roep_functie` / pg_net 120,000ms. No parallel scheduler, billable retry, reduced source-quality gate, new secrets, synthetic signals or authorizations.

The original provider/partial proof, failure classification, true timestamps and CodeQL error redaction are preserved. Require protected CI + CodeQL, exact merged-source runtime deployment and provider readback. An HTTP 207 remains degraded even when partial signal observations have been recorded. Tests: `tests/brain-external-dataforseo-provider-timeout-20261019.test.mjs`.
