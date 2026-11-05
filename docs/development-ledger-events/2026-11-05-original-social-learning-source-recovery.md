# 2026-11-05 — original learning source truth and measurement repair

- Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `powerhouse|social-learning|personal-wrong-tenant-reactions-only-unmeasured-false-uplift|20261105-v1`.
- Owner: **existing** `bg_social_lus_*` functions invoked by original `powerhouse-content-orchestrator`; no new job.
- Source: canonical project `adhjwmvyoixzjtmiroln`, `social_posts` 28d personal canonical 17 posts / 14 with provider snapshot, 0 personal brand tenant posts. Original personal provider `metrics.reactions` present, `views_unavailable=true`, original SQL expects brand tenant and numeric likes/comments/impressions. Existing personal active baseline=0.
- Symptom: personal experimentation returns false missing data; missing impressions classified as low impressions, missing baseline can yield false uplift, and all measured post IDs are potentially marked experiment applications without exact source attribution.
- Fix: one original SQL migration correcting exact tenant and provider metric read, preserving missing denominator, materializing only evidence-limited TESTING lessons to the original social_learnings store, with no fake wins or blanket experiment application attribution.
- Evaluation: `tests/brain-original-linkedin-learning-source-metric-truth-20261105.test.mjs`; machine record `brain/learning/2026-11-05-original-linkedin-provider-metric-learning-truth-v1.json`.
- Human docs: `docs/changes/2026-11-05-social-learning-data-contract-root-repair.md`; original social/CRO skill updated.
- Required before GREEN: protected CI + migration promotion + `pg_get_functiondef` production source readback + actual original next natural execution and independent measured variant/outcome. Missing impressions remain missing, no artificially generated revenue or published post.
- No bypass of consent, tenant authority, model governance, provider limits, anti-duplicate, CodeQL or RLS. No second scheduler, executor, store, or publisher.
