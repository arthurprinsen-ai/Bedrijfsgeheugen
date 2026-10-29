# Learning ledger — Tavily 432 provider guard, 2026-10-29
Obligation `powerhouse|external-search|tavily-plan-limit-432|20261029` / issue #4215.
Cause: AUTH ACTIVE but search HTTP 432; repeated provider probes under concurrent topics. Existing DataForSEO was already fallback.
Fix candidate: gate only failed Tavily probes; preserve real DataForSEO organic receipts, existing Brain logging and source truth.
Evidence needed: protected PR Required/CodeQL, merged SHA, Supabase edge version, authenticated scheduler invocation, positive/negative source observation and portal readback. Before/after spent credits UNKNOWN. No false green.
