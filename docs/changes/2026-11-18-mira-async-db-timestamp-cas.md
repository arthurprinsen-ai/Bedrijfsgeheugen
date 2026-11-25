# Mira original provider recovery: preserve async failure result with DB-authoritative lease

2026-11-18. Parent original P0 #5232, closed-loop P0 #4198. Same canonical `2026-11-18:instagram` media job, same frozen winner, same OpenArt video `r6sZX8kdGyvpD6zEbWg7`.

## Independently verified failure and root cause
Protected PR #5995 was merged and its original Supabase Edge Function v969 was read back **byte-identical to GitHub main for all 11 files**. The existing original media-router preflight request `net._http_response 34850` returned HTTP200 `WAITING_PROOF`, proof_attempt=1 and durable cooldown. Its background independent original `submit_asset` call returned HTTP503 in Supabase edge logs at `2026-11-18T06:47:58.518Z`. The initial claim recorded `vision_retry_started_at=2026-11-18T06:47:40.928Z`, but independent database readback showed job `updated_at=2026-11-18T06:47:40.986122+00`. Original `powerhouse_validate_instagram_media_job_v1` trigger replaces every incoming `updated_at` with database `now()`, therefore the old async writer's `.eq('updated_at',claimedAt)` did not match the returned row. Supabase returned a no-error **zero-row update**, which previous code did not inspect. Production job retained `last_error=null` although the real async independent verifier had already failed.

This is a loss of *operational error evidence*, NOT proof of Instagram success or face mismatch. The original video and durable attempt clock remained intact, so the next bounded retry can resume without another OpenArt generation.

## Source-level original-owner fix
The original preflight claim now requests `.select('id,updated_at')` and the async failure writer uses exactly `claim.data.updated_at` (the DB-returned trigger timestamp), never the caller's request clock. It also requires original job id, status `WAITING_PROOF`, unchanged DB lease and `last_error IS NULL`; `select('id').maybeSingle()` distinguishes RECORDED from CONCURRENT_RESULT_PRESERVED and WRITE_FAILED. A real verified result / real face rejection has precedence; the error write never overwrites it. Logs use only safe machine codes. No credential, provider retry or media publication side effect is created by this correction.

## Regression and release
`tests/brain-mira-async-claim-timestamp-cas.test.mjs` reproduces the two different timestamps and asserts the mismatch, correct database-returned claim, protected CAS, concurrent media PASS preservation and invalid receipt refusal. Protected Required+CodeQL, exact main commit, original Supabase active version, and an independent next same-video provider result are required before declaring the fix effective.

No extra executor, new scheduler, video, AI model, API token, RLS change, face-threshold reduction or social provider write. Parent #5232/#4198 stay OPEN until true three-frame face scores >=0.940, temporal continuity, Meta ID/GET, ONE BRAIN/Heartbeat and effect.
