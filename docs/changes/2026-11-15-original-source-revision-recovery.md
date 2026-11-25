# Original #175 → #140 → Heartbeat same-executor source-revision recovery

**Date:** 2026-11-15
**Existing P0:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
**Owner:** existing content orchestrator #140 and original source capture #175, independently verified by original Heartbeat.
**Release path:** protected GitHub main → original Supabase Edge code owner → exact source/readback → next *natural* #140 run. Never direct-push main, direct production overwrite, new scheduler, or release-only green.

## Production reproduction and exact existing-owner proof
Original #175 had captured today's source manifest at 12:46 UTC. A genuinely provider-observed company LinkedIn source refresh arrived through existing #177 at 14:50 UTC, changing the current 28-row manifest. At 15:01 UTC, original `public.powerhouse_daily_source_consume_v1` returned `consumer_accepted=false` and `SOURCE_REVISION_MISMATCH_OR_PRODUCER_MISSING_RETRY_ORIGINAL_175`. This is a correct consumer rejection and an observable source-to-consumer delay, not permission to manufacture receipt proof.

The existing same-source `powerhouse_capture_growth_source_daily_v1('2026-11-15')` was invoked once with original advisory locking; result `MEASUREMENTS_CURRENT`, source count 28, immutable SHA256 `e108560fd449a29c059c80079c843ea6a1c831d80c9342f87ffb7688186c89b7`, missing or unverified sources 5. The existing `powerhouse_daily_source_consume_v1` then read and accepted precisely this SHA and 28 rows. Original `powerhouse_commercial_intelligence_heartbeat_v1` read back the identical SHA, `daily_source_brain_ack_verified=true` and stage `ORIGINAL_BRAIN_INPUT_ACCEPTED_WAIT_CRO_OUTCOME`; its SEO-to-CRO site receipt remained `accepted=false` and `site_receipt_count=0`. No new provider send, content post, external mutation, CRO treatment, lead/order or revenue was performed or claimed.

## Safe structural repair
The existing authenticated/leased `powerhouse-content-loop` Edge is **already invoked by #140**. On today's exact original-source `consumer_accepted=false` mismatch only, call the original #175 capture and original #140 consume functions in order and then the original Heartbeat. Use the original PostgreSQL advisory lock and single source owner. Do not rerun past days, interrupt publishing lanes, override an independent veto, or add a new cron or queue. The original no-match/overlap/no-proof response stays `degraded`; no external provider mutations are made by this repair. Pure helper verifies original contracts, tenant, date, 64-hex revision, source count, and exact Heartbeat ACK.

## Acceptance and negative controls
Protected Required/CodeQL/backend+Supabase Edge tests, protected exact-main merge and authoritative Supabase Edge byte-level readback are required before claiming *code deployed*. A fresh *natural* #140 invocation after the next post-#175 source update must show original source mismatch recovery, exact 175/140/Heartbeat SHA receipt, original ONE BRAIN owner continuity, no duplicate posting and no extra executor. Safe failure under source mismatch, unavailable producer, busy advisory lock, wrong tenant/day/revision, stale Heartbeat and no business outcome must remain RED or EVIDENCE_DUE.

A source ACK is a proven transport step. Actual site modification, objective experiment, provider ID, measured savings, order and learning are separate original obligations; original P0 remains OPEN until all required business effects are independently proven.
