# 2026-09-25 — Skill projection replay dependency bootstrap

- Fingerprint: `skill-projection-replay-dependency-bootstrap-20260925-v1`
- Failed check: Skill Projection job `108106029566`.
- Observed root cause: `parse5` missing before historical replay could execute.
- Repair: install repository dependencies before canonicalization.
- Additional contract repair: i18n regression no longer requires throw adjacency after `if(cacheRequired)`; it still proves cache-missing logging and fail-closed exception semantics.
- Regression: `tests/brain-skill-projection-dependency-bootstrap-v1.test.mjs`.
