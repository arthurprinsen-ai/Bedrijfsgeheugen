---
name: powerhouse-daily-data-one-loop
description: Original daily SEO, website, blog, DataForSEO, external intelligence, AI and CRO source-to-BRAIN-to-Heartbeat evidence contract. Use for daily measurement, source freshness, recovery, publishing and growth optimization.
---

# Original daily growth data loop: ALWAYS ONE LINEAGE

**Original owner only.** The existing Supabase scheduler #175 (every six hours) calls `powerhouse_capture_growth_source_daily_v1`, which now archives seven additional real-data classes through `powerhouse_daily_source_archive_v1` in `powerhouse_growth_source_daily_v1`. Original #140 hourly `powerhouse_content_closed_loop_tick_v1` calls `powerhouse_daily_source_consume_v1` and existing Heartbeat `powerhouse_commercial_intelligence_heartbeat_v1`. Do not create new jobs, schedulers, Make/Buffer fallbacks or cross-tenant writers.

**Exact evidence:** Daily per-source data MUST have canonical tenant, provider/raw table authority, actual local measurement day, observed-at timestamp, source revision, data quality and metrics. Distinguish `dataforseo_provider_activity` diagnostics from `seo_keyword_provider` real search volume. An empty provider set means `MISSING` or `AWAITING`, not zero search demand. Technical SEO resolver success is NOT a full audited website. AI recommendations are NOT executed experiments. A published blog is NOT a GA4 conversion. Rejected external signals are not actionable.

**Canonical BRAIN handshake:** Store a stable SHA256 of the ordered source manifest under ONE ORIGINAL `GROWTH_SOURCE_DAILY_HANDOFF` obligation for exact tenant/day; **OPEN** until downstream real outcome. Original #140 must independently reread the source table and compare the SHA; no positive ACK on a missing/revised table. On verified source, record consumer input acceptance, a data-grounded reversible CRO hypothesis and original Heartbeat readback. Accepted input is never proof of completed A/B test, causal uplift, revenue, ranking or later customer outcome.

**Fault ownership and learning:** Errors never disappear behind a green cron. Persist failed stage, original owner (#175/#140/provider), exact source and revision, evidence, recovery cause, next safe action, regression, preventive rule. Retry bounded and idempotently under original executor. Keep original publisher active, preserve provider ID/consent requirements, do not republish. Update user-visible portal health only from independently checked original production receipts.

**Source path:** `supabase/migrations/20261112173000_original_daily_source_brain_heartbeat_v1.sql`. **Regression:** `tests/brain-original-daily-source-brain-heartbeat-one-loop-20261112.test.mjs`. **Human log:** `docs/development-ledger-events/2026-11-12-daily-seo-website-ai-one-brain-lineage.md`. **Existing incident:** #4198. Protected merge and native readback mandatory.
