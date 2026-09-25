# 2026-09-22 — Instagram Mira Reel seed normalization

- Fingerprint: `instagram-mira-reel-seed-normalization-v1`
- Incident: today's Instagram obligation had no eligible daily winner although a Mira calendar seed existed.
- Root cause: old calendar seed format `carousel + placid_visual` contradicted Reel-only v3.
- Blast radius: 28 additional future Mira seeds had the same stale route.
- Production correction: normalized today's recommendation, materialized the same immutable winner/job, then applied the database boundary normalizer; post-migration stale count = 0.
- Current today's provider state: canonical job is Reel/OpenArt and remains `WAITING_PROVIDER_CONNECTION`; no fallback publication is allowed.
- Prevention: before insert/update, every Mira daily-life Instagram recommendation is normalized to Reel/OpenArt.
- Regression: `tests/brain-instagram-mira-reel-seed-normalization-v1.test.mjs`.
- Skill: Instagram publisher skill treats stale carousel/Placid seeds as policy drift requiring normalization, never a reason to skip or substitute media.
