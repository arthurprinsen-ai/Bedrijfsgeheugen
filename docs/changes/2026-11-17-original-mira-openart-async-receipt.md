# 17 November 2026 — Original Mira OpenArt asynchronous history receipt

Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232

## Verified production gap
The original Supabase RPC powerhouse_claim_instagram_media_job_v1 exclusively claims a matching current/future dated media job and increments attempts, but before this repair the original media router only exposed generation_preflight and submit_asset. OpenArt MCP generation returns a PENDING historyId before completing. No original-authority endpoint pinned that ID while the job remained CLAIMED. Interruption can strand the claimed job and make a later agent guess whether it already bought video, risking duplicate expense or lost work.

## Original-owner only fix
Under the already-authenticated powerhouse-instagram-media-router, add action pin_generation. It accepts exactly one provider-created original history ID, only after the original source-backed same-day/next-day frozen PH-P winner and existing original atomic claim. Source/date, original worker, job/updated_at CAS, unchanged Mira master ID/URL, original OpenArt project, Wan 3.0 element2video model and independently verified quote <=640 credits must match. Store the history ID in the same original job's asset_manifest and set status GENERATING without creating external media, changing the recommendation, generating a second video or publishing. If an identical receipt is retried, return idempotent; a different history must fail. There is no new cron, sender, queue or Media API bypass.

## Authoritative two-stage completion
On a later ORIGINAL scheduled publisher run, first read the persisted media job. If status GENERATING, use OpenArt MCP creation_get(historyId), not another generate_video. If the same history is PENDING/RUNNING, preserve its state. If COMPLETE, obtain actual provider asset URL and submit to original media router action submit_asset, which alone verifies real native muted 1080x1920 MP4 bytes/hash, 3-frame Mira face >=0.940 and temporal >=0.900. Then existing sole Meta publisher sends once; independent Meta media ID/permalink GET, original ONE BRAIN named consumer PROCESSED and Heartbeat outcome are mandatory. If provider job fails, record actual error and keep same original owner and history; never retry blindly.

## Acceptance
Regression: tests/brain-mira-original-openart-async-receipt-20261117.test.mjs. Protected Required+CodeQL and exact native Supabase Edge provider source parity; then an actual new day source/winner, original CAS, real OpenArt generation+receipt, resumed matching history, exact native/video/Meta/Brain proof. Current Instagram 17-Nov still lacks a source winner and the last independently confirmed Meta post was Oct 3; this change must NOT be called an actual post until the true provider receipt is observed.
