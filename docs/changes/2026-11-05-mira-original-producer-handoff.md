# 5 november 2026 — Original Mira producer claim handoff

Parent: [#4439](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4439) and [#4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198).

## Fact observed in real production
At 2026-11-05 around 07:30 UTC, the canonical original Instagram media job was `WAITING_ASSET`, `attempts=0`, selected OpenArt, no `openart_history_id` and no approved final asset. The frozen winner was `5f95bf92-73f8-419a-bac4-0e388b256b76`, identical in the original Instagram channel decision and media asset manifest. Original publication obligation was `BLOCKED/MEDIA_ASSET_REQUIRED` without provider ID. The preventive media classifier already understood `MIRA_PRODUCER_CLAIM_REQUIRED`, but the later same-owner daily recovery ignored media job evidence and returned generic `MIRA_FINAL_MEDIA_PROOF_REQUIRED`.

## Minimal original-owner correction
The existing `powerhouse-content-loop` already reads today's media job for preventive checks. Pass the same verified read-only row, including `attempts`, to `assessDailyPublicationRecovery` (no additional query, sender or scheduler). Classify as `MIRA_PRODUCER_CLAIM_REQUIRED` ONLY if: original immutable winner present, matched with job manifest, job `WAITING_ASSET`, attempts exactly zero, no last error, no existing OpenArt history and no final asset URL. Provide exact original media producer owner/handoff and preserve fail-closed fallback for rejected/claimed/mismatched job. Source read failure never confers producer authorization.

The existing publisher, provider generation, claim owner, paid credits, identity checks and provider-readback do not change. The classification **does not** create or approve a video, send a social post, grant OAuth or claim a job. Autonomous action must be done by existing authorized producer in its original lane, under original budgets and exclusivity.

## Prevention and release proof
Original skill `.agents/skills/instagram-composio-publisher/SKILL.md` updated. Test `tests/brain-daily-publication-no-silent-gap-20261031.test.mjs` replays exact 5 Nov source shape, checks strict matching/zero attempts, no re-use of provider history, immutable LIVE_PROVEN fence and runtime wiring. Machine learning `brain/learning/2026-11-05-mira-producer-claim-original-recovery.json` and canonical ledger.

Require protected exact-head Required + CodeQL + full BRAIN, original single owner merge, authorized Supabase Edge deployment, exact source bundle readback, natural original #140 run and observed original `next_action` containing `MIRA_PRODUCER_CLAIM_REQUIRED`. For full Instagram GREEN, separately require native asset, Mira >=0.940 start/middle/end, exact external Meta ID/permalink/readback and measurement. No false-green if no video.
