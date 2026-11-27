# 12 Nov 2026 — Original source-event observed-time mismatch

- Incident: [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198). Original owner: `powerhouse-runtime-scheduler-mux-v1`, cron #171.
- Failure: original `measurement_consumer.accepted` truth and source event UUID/hash could be present while `measured_at` was NULL or timestamp from an unrelated older observation. Reproduced for company LinkedIn 10 Nov, 11 Nov and temporal mismatch 9 Nov after a source-linked Windsor readback.
- Original provider proof: Windsor `linkedin_organic` account `18234216`, posts 9/10/11 Nov, 1/1/4 impressions, as-of original provider fetch `2026-11-12T14:12:23Z`. Three original `social_metric_snapshots` rows stored with exact external IDs, account identity, observed time, and `PROVIDER_OBSERVED_LINKED`; original #171 stage progressed to `WAIT_ANALYSIS`.
- Root cause: single original BRAIN SQL producer selected event ID from `social_metric_snapshots` but read event timestamp from `content_publication_obligations.measured_at`.
- Fix: same original function selects ID and observed time together, resets per post, adds explicit source-time contract, routes analysis to original analysis owner.
- Regression: `tests/brain-original-metric-event-temporal-handoff-20261112.test.mjs`. BRAIN learning, agent skill and shared `AGENTS.md` documented. Production only after protected merge.
- Prevent: no consumer `accepted=true` with missing/mismatched measurement time; do not mark analysis, next-post experiment or revenue successful without independent ACK; no new runtime executors.

## 12 November 2026 — independent provider-829 source-lock reconciliation

- Protected original #5651 applied `20261112144500_original_social_legacy_alias_acks_v1`, verified independently in native `supabase_migrations.schema_migrations`: 829 actual production rows.
- The subsequent temporal handoff candidate was correctly blocked when current Git source lock contained 828, or when a single PR tried to combine an already-applied history adjustment and the unapplied 830th migration. No gate bypass or false production claim.
- An independently protected applied-provider-only original main release, SHA `d1c4e991ca35fe537d7227b97796f292d8927a3f`, now carries the already-applied 829th history in the immutable source lock.
- This original seven-path PR is synchronized to exact 829-lock main. The GitHub PR base revision is retargeted to that exact current SHA so protected PR checks evaluate the 830th **proposed, UNAPPLIED** migration rather than mixing stale previous provider lock state.
- Previous Required workflow observed HTTP 503 `github-api-transient-unavailable-v1` with three bounded retries; an automatic same-head retry then passed admission but correctly detected the stale PR-base migration mismatch. Source code was never force-merged. Retain both provider failure receipts as regression evidence. Next release must pass fresh complete Required + CodeQL + Supabase hosted preview + exact native producer/consumer proof.
