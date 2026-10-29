# Verified execution means actually executed

Date: 2026-10-29. Obligation: powerhouse-sales-action-execution-truth-20261029. Status: SOURCE_CANDIDATE_NOT_LIVE.

Read-only Supabase seven-day audit: 1,959 expired and 131 skipped sales actions nonetheless had cycle stage execution, NULL executed_at and linked outcome not_executed. Only 136 examined events were linked to done actions with an execution timestamp. These are historical misclassified events, not provider deliveries.

Root cause: public.powerhouse_advance_sales_action_v1 treated non-null outcome_id as proof of execution, even when negative. Source correction: require both done status AND non-null executed_at before appending execution. Existing canonical idempotency, stage sequence, outcome callback and fail-closed policies remain unchanged. Do not rewrite immutable history. Historical data must be source-joined to verify execution. No second cron, table, writer or fake send.

Protected Required/PostgreSQL/CodeQL plus exact Supabase migration and independent source readback required before LIVE. Independent agent/skill/before/after and revenue measurement remain OPEN.
