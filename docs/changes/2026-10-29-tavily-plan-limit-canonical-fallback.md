# 2026-10-29 — Tavily 432 quota-gate (canonical external intelligence)
Fingerprint `powerhouse|external-search|tavily-plan-limit-432|20261029`.

Tavily's Composio tool is authorized but a real search returns HTTP 432 (plan limit). The existing Supabase `bg-externe-signalen` producer already uses DataForSEO with real organic results and source receipts. New in-isolate singleflight on Tavily plus bounded 432 (15 min) and 429 (1 min) cooldown reduces repeated futile provider requests while preserving existing fallback, producer authentication, batch=3, cost constraints, provider provenance, URL deduplication and strict partial-failure verdict.

Composio Serper and Exa are only on-demand research providers; there is no verified Supabase credential or automatic failover for either. No new cron, executor, database schema, publisher or direct customer egress.

LEARN: baseline simultaneous 432 can cause multiple Tavily calls; target <=1 first-probe call for three overlapping topics. Node regression is local evidence. Production cost delta and source ingestion impact remain UNKNOWN until exact function deployment, authorized execution and canonical readback.
