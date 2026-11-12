# 12 Nov 2026 — Original source-event observed-time mismatch

- Incident: [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198). Original owner: `powerhouse-runtime-scheduler-mux-v1`, cron #171.
- Failure: original `measurement_consumer.accepted` truth and source event UUID/hash could be present while `measured_at` was NULL or timestamp from an unrelated older observation. Reproduced for company LinkedIn 10 Nov, 11 Nov and temporal mismatch 9 Nov after a source-linked Windsor readback.
- Original provider proof: Windsor `linkedin_organic` account `18234216`, posts 9/10/11 Nov, 1/1/4 impressions, as-of original provider fetch `2026-11-12T14:12:23Z`. Three original `social_metric_snapshots` rows stored with exact external IDs, account identity, observed time, and `PROVIDER_OBSERVED_LINKED`; original #171 stage progressed to `WAIT_ANALYSIS`.
- Root cause: single original BRAIN SQL producer selected event ID from `social_metric_snapshots` but read event timestamp from `content_publication_obligations.measured_at`.
- Fix: same original function selects ID and observed time together, resets per post, adds explicit source-time contract, routes analysis to original analysis owner.
- Regression: `tests/brain-original-metric-event-temporal-handoff-20261112.test.mjs`. BRAIN learning, agent skill and shared `AGENTS.md` documented. Production only after protected merge.
- Prevent: no consumer `accepted=true` with missing/mismatched measurement time; do not mark analysis, next-post experiment or revenue successful without independent ACK; no new runtime executors.
