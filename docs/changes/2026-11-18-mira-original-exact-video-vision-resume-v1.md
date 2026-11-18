# Mira: close exact-video vision retry gap in original media router

Date: 2026-11-18. Original P0 #5232, commercial closed loop P0 #4198.

## Independent production evidence
Original media job `4a68dc41-6e60-4b64-ba7b-400086cb7296` for the original frozen winner `ab10709a-bad8-4ad4-9305-1b7c0cc83c44` has **one** OpenArt history `r6sZX8kdGyvpD6zEbWg7`. The original video completed at 1080x1920/8s and was recorded by `powerhouse_complete_instagram_media_job_v1` as `VERIFYING`. It did not obtain original 0.940 frame scores or a Meta external ID.

The initial router frame check `net._http_response #34812` falsely reported an identity mismatch after provider 429. That classifier was separately fixed and independently proven in Supabase production edge-router v967 by exact GitHub file readback (protected PR #5994). The next original router `net._http_response #34828` correctly reported HTTP 503 `MIRA_FRAME_VISION_PROVIDER_UNAVAILABLE`. Still no measured face confidence.

## Missing self-heal boundary
Existing `preflight` preserved a completed video in `VERIFYING` but never automatically re-ran the original `submit_asset` verification. Its CRON/readiness checks could therefore stay active while the same paid asset never received the required face/temporal proof. An expired or failed background verifier without durable cooldown also risked indefinite stall.

## Safe bounded same-authority fix
Extend **only existing** `powerhouse-instagram-media-router` preflight, after the original source/winner and security gates and before the existing source-led path. The pure planner validates canonical tenant, current local day, exact already-selected frozen PH-P library scene, same original video/job, exact OpenArt URL/history/project/master, original media attempt 1, no previous post, no veto, no identity PASS and original provider connection. Use one CAS job row and original background `submit_asset`; the background itself invokes actual native-video/frame/temporal verifier and the original publication gates. **No** new media generation, queue, scheduler, sender, OpenArt history, fallback, extra data store, secret log, or synthetic identity proof.

Minimum 30-minute cooldown after first OpenArt completion; then exponential retry cooldowns (30/60/120 minutes from attempts), max **three** original same-video proof retries. A missing background ACK can be resumed after the durable cooldown. Provider/transport failure remains retryable; genuine measured identity/creative-quality failure is a HOLD for original review, never an excuse to buy another video. CI tests cover source mismatch, atomic lease, duplicate prevention, cooldown, crash recovery, cap and unchanged 0.940/Meta gates.

## Release and terminal evidence
Protected Required, CodeQL, merge main, exact Supabase function version and source compare, same original job safe preflight ACK, **actual** first/middle/end 0.940 scores + temporal quality, Meta external ID and independent public GET, Heartbeat effect and Brain learning ACK. None of these are inferred from CI or scheduler success. Do not close #5232/#4198 before real destination readback.
