# Instagram frozen-winner accepted-state contract — 20 september 2026

Fingerprint: `instagram-winner-accepted-state-contract-v1`.

## Incident

The Instagram daily-winner flow selected one immutable Mira recommendation correctly, but production orchestration kept failing at `select-pending` with `INSTAGRAM_DAILY_WINNER_LINEAGE_REQUIRED`.

## Root cause

The selector marks the frozen recommendation as `accepted`. The downstream `recommendationEligible()` function only accepted `suggested` or empty status. Two state machines therefore disagreed about the valid lifecycle of the exact same recommendation.

## Fix

For downstream reuse of the already selected winner, `accepted` is now an eligible status alongside `suggested` and empty. The winner ID remains authoritative and no fallback reranking is introduced.

## Safety boundary

This does not weaken Mira-only identity checks, exact-final-media proof, OpenArt/provider routing, publication authority, dedupe or provider readback. A winner can be reused downstream only through the existing canonical lineage.

## Prevention and verification

Regression coverage in `tests/brain-instagram-mira-winner-selection-v1.test.mjs` requires the accepted-state contract to remain present. Production is only terminally proven after protected merge, Supabase deployment/source equality and a subsequent closed-loop execution without the prior lineage error.
