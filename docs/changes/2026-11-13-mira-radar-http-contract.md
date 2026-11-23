# 2026-11-13 — Original Mira radar: provider HTTP is not source success

## Incident and original producer
Fingerprint: `MIRA_RADAR_HTTP_200_WITH_SOURCE_RECOVERY_DUE_20261113`.
Production evidence on 2026-11-13: original cron #120 active; latest observed Mira source 2026-11-08 20:02 UTC; 373 original signals, 125 eligible, only 24 eligible observed in the last 10 days. The 2026-11-13 Instagram obligation was still PLANNED with MIRA_UNIQUE_SOURCE_WINNER_REQUIRED; previous independently sourced winners were immutably frozen for 8 and 9 Nov. Scheduled POST on 2026-11-12 20:02 UTC returned HTTP 200, while the original Edge function could return `ok:false, state:SOURCE_RECOVERY_DUE` with the default 200 HTTP status. Cron `succeeded / 1 row` only verifies async enqueue and must never close a source-to-consumer handoff.

## Canonical repair
Keep the original cron #120 `powerhouse-mira-problem-radar-v1`, original Edge Function, immutable unique selector `powerhouse_select_instagram_daily_winner_v1`, publisher and original ONE BRAIN incident fingerprint. Status classification now reports:
- 200 only when the original materializer's `supply.ok === true` and no errors are present.
- 503 when no real unique dated eligible source is found and no other errors are present.
- 502 when provider, materialization, source read, upsert, personal source rotation, or ONE BRAIN writeback errors are recorded.

The structured JSON, recovery owner, source lineage, explicit `sendsAuthorized:false`, and `brain_observe_failure` are unchanged. No fabricated source, invented citation, status update, post, provider receipt, additional cron, worker, or Make/Buffer fallback.

## Verification / recovery
1. Check original `cron.job_run_details` #120 and independent `function_edge_logs` HTTP outcome for `/functions/v1/powerhouse-mira-problem-radar`; do not equate a successful pg_net enqueue with a completed source search.
2. Check `max(observed_at)` and real eligible `powerhouse_mira_problem_signals_v1`, then `powerhouse_instagram_daily_winners_v1` for the local day and original `content_publication_obligations` for channel instagram.
3. On 502/503, the **same** original radar owns repair/retry within existing canonical execution; preserve 90-day URL/hash dedupe, 3-day topic dedupe, source publication freshness, PH-P-approved Mira scene and original unique winner. Continue the original executor. Do not override the gate.
4. A PR merge is not Edge production proof. Require protected CI, independent Supabase deployed Edge version/content confirmation, then a subsequent real original radar POST and real source/ONE BRAIN consumer readback before marking the entire chain GREEN.

Regression: `node --test tests/brain-mira-radar-http-contract-20261113.test.mjs`. Closed-loop effect is **not proven** until a fresh eligible source, unique winner, media asset, independent Meta provider GET, and learning ACK are observed.

## 2026-11-13 16:45:37 UTC — independent provider source readback

Protected merged PR [#5747](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5747), merge SHA `21a7793cb623960471bf8c51d19e6ff93df39246`. Exact-head [Required CI](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43465279018) and [CodeQL](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43465278985) SUCCESS. Canonical [Supabase provider authority](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43465759485) SUCCESS; independent real production Supabase Edge `powerhouse-mira-problem-radar` **v955** now contains `classifyMiraRadarHttpStatus({sourceReady:supply.ok,errors})` and the shared helper, unlike previous v954. [Skill projection](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43465763059), [learning contract](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43465759425), and [original BRAIN handoff](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43465805525) SUCCESS.

Release state is **DEPLOYED_TRANSPORT_FIX_ONLY**. Source and publication outcomes remain OPEN: last real source observed 2026-11-08, original Instagram for 13 Nov PLANNED, 366 original CONTENT_HANDOFF OPEN, seven assurance loops RED. Both original cron #120 and #171 ACTIVE. The next actual scheduled radar result and distinct source, approved media, Meta readback and learning consumer receipts are **not yet proven**. Never infer them from a deployed Edge version or green workflows. The original incident has the immutable [production evidence comment](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232#issuecomment-6859256876). No extra scheduler, no invented source, no manual status override.
