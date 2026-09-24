# 2026-09-24 — Production readback manual exact-main

- Fingerprint: `production-readback-manual-exact-main-v1`
- Root cause: push-only readback plus cancel-in-progress kon functionele browserproof superseden zonder canonical rerunpad.
- Fix: `workflow_dispatch` op Production Release Readback.
- Manual mode: forceert deployment identity, browser verification en `/prijzen`.
- Regression: `tests/brain-production-readback-manual-exact-main-v1.test.mjs`.
- Learning: `brain/learning/production-readback-manual-exact-main-20260924-v1.json`.
- Skill: `.agents/skills/powerhouse-continuity/SKILL.md`.
- Terminal bewijs blijft exact SHA + provider identity + pricing/i18n browserproof.
