# Learning ledger — Tavily 432 provider guard, 2026-10-29
Obligation `powerhouse|external-search|tavily-plan-limit-432|20261029` / issue #4215.
Cause: AUTH ACTIVE but search HTTP 432; repeated provider probes under concurrent topics. Existing DataForSEO was already fallback.
Fix candidate: gate only failed Tavily probes; preserve real DataForSEO organic receipts, existing Brain logging and source truth.
Evidence needed: protected PR Required/CodeQL, merged SHA, Supabase edge version, authenticated scheduler invocation, positive/negative source observation and portal readback. Before/after spent credits UNKNOWN. No false green.
 
## Subsequent release-blocker readback — 2026-10-29
First code PR #5127 protected-merged as `e93852af5cc3a4c68df925ddf33260a2504f4fcc`. Supabase Edge Production Authority failed `SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG:bg-externe-signalen`; deployed provider still v20 old source. Fix via same incident lineage, add only canonical function registration and regression in protected follow-up. Continue without bypass/forced deploy. Result unknown until provider version/source and authenticated scheduler readback.
