# Instagram Mira Reel seed normalization v1

Date: 22 September 2026

Fingerprint: `instagram-mira-reel-seed-normalization-v1`.

The Reel-only v3 policy and the older Instagram calendar were inconsistent. A Mira daily-life recommendation for 22 September still requested `carousel + placid_visual`, so the fail-closed daily-winner selector correctly returned `NO_ELIGIBLE_MIRA_DAILY_WINNER`. The same stale pattern existed on 28 future dates.

The fix moves policy enforcement upstream to the canonical recommendation boundary. A database trigger normalizes Mira daily-life Instagram recommendations to `reel + openart_video + OpenArt` before winner selection, removes the legacy visual-generator route and records the normalization lineage. The migration also repairs already-planned future seeds.

Production was migrated with the same SQL. Readback after migration showed zero stale future recommendations. The 22 September recommendation was selected as the immutable Reel winner and materialized into one OpenArt media job. Publication remains fail-closed until a new OpenArt MP4 and exact-final-media proof exist.
