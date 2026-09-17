# Instagram exact-final-media proof — canonical learning v1

Date: 2026-09-17
Fingerprint: `instagram-exact-final-media-proof-v1`
Status: `LIVE_AND_PROVEN` for the implementation/release
Historical 2026-09-17 Instagram item: `BLOCKED_UNPROVEN`

## Purpose

This document is the human-readable projection of the canonical Powerhouse learning for the Instagram exact-final-media proof hardening. Runtime truth remains in protected GitHub main, Supabase production/readback, publication obligations, and `public.brain_records`.

Canonical machine record: `learning:instagram-exact-final-media-proof-v1`.

## Incident / problem

Provider/Buffer transport state such as `sent` was readable, but the exact final Instagram media bytes/frames could not be retrieved afterwards. Treating provider transport as proof of Mira identity or exact final media would create a false-positive publication proof.

Reusable failure fingerprint: `provider-transport-readable-but-final-media-bytes-not-retrievable-v1`.

## Root cause

The publication boundary previously did not require all proof to be bound to the exact final Instagram asset before dispatch. In particular, immutable final-media digest, exact final asset identity, verified visual evidence, Mira daily-life identity, verified publish format, and for video/reels complete start/middle/end frame evidence were not all unavoidable preconditions at the same boundary.

A second release-management failure mode also appeared during closure: after a Required run had become green, protected `main` advanced through PR #1914. That made the earlier green candidate stale even though there was no code regression in #1913.

## Implemented guardrails

The canonical `bg-pre-publish-review` gate now fails closed unless all applicable evidence is present:

- exact canonical Instagram Buffer channel id is pinned;
- `final_media_sha256` is present;
- `exact_final_media_proven=true`;
- exact final asset URL is present and equals the inspected visual asset;
- visual evidence is verified and contains `evidence_refs`;
- final media is verified as `mira_daily_life`;
- publish format is verified;
- placeholders/broken renders are blocked;
- reels/videos require separately verified start, middle and end frames with evidence refs;
- all proven video frames must carry Mira daily-life identity;
- provider `sent` remains transport evidence only and never implies Mira PASS;
- historical media must not be regenerated, replaced or republished merely to manufacture green proof.

## Release evidence

Implementation PR: #1913
Tested final head: `f82c003ad1f6ec0be2eae3aa99d15097f24ffa82`
Protected merge SHA: `eeadabbb7dbef337953dd6abbfb0445bfe673296`
Required test: run `35216053855`, run number `4269`, terminal `success`
Selected lane: `backend / backend`, terminal `success`
BRAIN delivery for the exact same head: terminal `success`

When `main` advanced after the first green candidate, recovery did not bypass protection. A non-force two-parent merge commit integrated current main into the feature branch; Required was rerun on the new exact head; the PR was then merged using the expected head SHA.

## Production evidence

Supabase project: `adhjwmvyoixzjtmiroln`
Edge Function: `bg-pre-publish-review`
Production version: `9`
Production bundle digest: `ae6eb7cbcec2e7684b510064a302a07588bb2f0eb6af1cbb869a66a72d7b1471`

A production runtime probe with deliberately incomplete Instagram proof returned HTTP `422`, `can_publish=false`, decision `BLOCKED_IDENTITY_GATE`, including these required violations:

- `FINAL_MEDIA_DIGEST_REQUIRED`
- `EXACT_FINAL_MEDIA_UNPROVEN`
- `INSTAGRAM_FINAL_ASSET_REQUIRED`
- `INSTAGRAM_VISUAL_EVIDENCE_REQUIRED`
- `INSTAGRAM_MIRA_VISUAL_REQUIRED`
- `INSTAGRAM_MEDIA_FORMAT_UNVERIFIED`
- `INSTAGRAM_VIDEO_FRAME_EVIDENCE_REQUIRED`

The probe created no publication.

## Historical obligation remains fail-closed

The 2026-09-17 Instagram obligation remains `BLOCKED` with `EXACT_FINAL_MEDIA_PROOF_REQUIRED`.

Observed evidence continues to state:

- provider status `sent`;
- `transport_only=true`;
- `mira_gate_result=UNPROVEN`;
- `provider_truth_verified=false`;
- `republish_forbidden=true`;
- exact-final-media proof fingerprint `instagram-exact-final-media-proof-v1:2026-09-17:6aab7fa7587e9f368fe1d58c`.

This is correct behavior. The implementation is LIVE & PROVEN; the historical media item is intentionally not promoted to PASS because exact final bytes/frames are unavailable.

## Prevention rules

Future agents/chats must reuse these rules before changing or executing Instagram publication logic:

1. `EXACT_FINAL_MEDIA_PROOF_FAILS_CLOSED` — missing or ambiguous exact final media proof means BLOCK.
2. `PROVIDER_SENT_IS_TRANSPORT_ONLY` — `sent` proves transport, not final visual identity or Mira PASS.
3. `MIRA_PASS_REQUIRES_EXACT_FINAL_ASSET_VISUAL_PROOF` — identity evidence must bind to the exact publication asset.
4. `VIDEO_REQUIRES_START_MIDDLE_END_FRAME_EVIDENCE` — video/reel proof requires all three positions.
5. `NO_REGENERATE_OR_REPUBLISH_TO_MAKE_OLD_PROOF_GREEN` — never fabricate closure by replacing historical media.
6. `RECHECK_CURRENT_MAIN_BEFORE_PROTECTED_MERGE` — a green candidate can become stale when protected main advances.
7. `RERUN_REQUIRED_ON_THE_EXACT_FINAL_HEAD_AFTER_MAIN_ADVANCES` — merge only after Required is green on the exact final head.
8. `EXPECTED_HEAD_SHA_ON_PROTECTED_MERGE` — use exact-head merge protection to prevent TOCTOU drift.
9. `WRITEBACK_IS_DEFINITION_OF_DONE` — release evidence, root cause, prevention and residual obligations must be written back and read back canonically.

## Reuse / preflight instruction

Before Instagram generation, review, dispatch, recovery, retry, reconciliation or publication, read the canonical Powerhouse state and this fingerprint. Reuse the existing publication lane and evidence store; do not create a parallel queue, media store, learning system or alternative identity gate.

If exact final media bytes/frames cannot be proven, keep the item `UNPROVEN/BLOCKED`. Do not infer proof from provider transport metadata.

## Closure boundary

This learning proves the hardening implementation, protected delivery, Supabase deployment, production fail-closed behavior, and canonical writeback. It does not claim that the historical 2026-09-17 Instagram media itself has become verified, nor does it claim engagement, lead or revenue impact.