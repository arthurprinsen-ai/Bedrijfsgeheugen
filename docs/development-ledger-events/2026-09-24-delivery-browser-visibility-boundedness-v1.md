# 2026-09-24 — Delivery browser visibility boundedness

- Fingerprint: `delivery-browser-visibility-boundedness-v1`
- Root cause: route-level/page-side async waits were not fully bounded, so the full-sitemap browser gate could consume the runner until outer job timeout.
- Fix: finite sitemap, navigation, fonts and total-sweep budgets.
- Safety: gate remains fail-closed; visibility, occlusion, content-length and CLS checks stay mandatory.
- Regression: `tests/brain-standalone-visibility-boundedness-v1.test.mjs`
- Skill: `.agents/skills/powerhouse-browser-gate-boundedness/SKILL.md`
- Status: `IMPLEMENTED_CANDIDATE` pending protected merge and production readback.
