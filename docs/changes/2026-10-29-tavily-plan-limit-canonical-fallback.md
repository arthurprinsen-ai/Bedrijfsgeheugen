# 2026-10-29 — Tavily 432 quota-gate (canonical external intelligence)
Fingerprint `powerhouse|external-search|tavily-plan-limit-432|20261029`.

Tavily's Composio tool is authorized but a real search returns HTTP 432 (plan limit). The existing Supabase `bg-externe-signalen` producer already uses DataForSEO with real organic results and source receipts. New in-isolate singleflight on Tavily plus bounded 432 (15 min) and 429 (1 min) cooldown reduces repeated futile provider requests while preserving existing fallback, producer authentication, batch=3, cost constraints, provider provenance, URL deduplication and strict partial-failure verdict.

Composio Serper and Exa are only on-demand research providers; there is no verified Supabase credential or automatic failover for either. No new cron, executor, database schema, publisher or direct customer egress.

LEARN: baseline simultaneous 432 can cause multiple Tavily calls; target <=1 first-probe call for three overlapping topics. Node regression is local evidence. Production cost delta and source ingestion impact remain UNKNOWN until exact function deployment, authorized execution and canonical readback.
 
## Protected-main Supabase deployment continuation
PR #5127 merged to main `e93852af5cc3a4c68df925ddf33260a2504f4fcc` after Required+CodeQL SUCCESS. The existing Supabase Edge Production Authority refused deployment with `SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG:bg-externe-signalen`. The provider remained version 20 with the old source. The direct deploy shortcut is not used.

This follow-up registers the already-existing function in `supabase/config.toml`, preserving `verify_jwt=false` because the entrypoint enforces the existing independently checked scheduler token `x-powerhouse-token`. No second scheduler, no additional DB writer, no public direct invocation. The new regression checks this configuration contract. Live requires provider exact-version/source/readback and canonical source observations, not only GitHub success.

## Live v21 runtime test and billable 40101 prevention
One authorized invocation of `bg-externe-signalen` v21 (pg_net request 15928) returned HTTP 207: 2/3 topics successful, 19 verified results, 1 allowed. The third DataForSEO task was `40101` (search-engine internal failure), not `40102` (real no results). DataForSEO explicitly states that 40101 is already internally retried and may be charged: https://dataforseo.com/help-center/what-does-the-40101-error-mean .
Remove only `40101` from the extra client retry allowlist; preserve failed-topic numeric evidence and non-GREEN 207. Existing scheduler, source gate, authenticating token, DataForSEO alternative, source observations and dedupe stay authoritative. Exact-head tests, merge and new Edge function version/readback required.
