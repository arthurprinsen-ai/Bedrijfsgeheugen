# Instagram Mira daily winner lineage v1 — 20 September 2026

## Defect

The current system already blocks non-Mira and unproven media, but it did not have one immutable ex-ante winner for Instagram. Several downstream components could independently infer a recommendation or format. The concrete production symptom was that historical provider readbacks could still be normalized as `carousel` even for Reel-oriented recommendations, while the implementation-verification obligation still lacked an ex-ante `daily_winner` lineage.

## Permanent contract

One row in `powerhouse_instagram_daily_winners_v1` is selected before media generation and publication. Selection is deterministic and immutable for that date. Only Mira daily-life recommendations with supported image/Reel format are eligible; Reel candidates require the OpenArt route.

The same `recommendation_id` and `score_version` must then appear in:
- the Instagram media job;
- the generated content artifact;
- the channel decision;
- the central publication capability;
- the resulting `social_posts` row;
- outcome/learning evidence.

The publication authority fails closed if any of these identities disagree. For Instagram provider readback, the persisted winner/media-job format overrides older experiment recipe metadata, so a proven Reel is normalized as `reel`, not `carousel`.

## Truth boundary

This fixes implementation and lineage. It does not manufacture a daily publish. If OpenArt/exact final media/provider proof is unavailable, that day's publication stays blocked while the safety and lineage contracts remain live.
