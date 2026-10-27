# 2026-10-06 — i18n production navigation commit recovery

- Type: RECOVERY / PRODUCTION_READBACK
- Obligation: `i18n-production-navigation-commit-20261005-v1`
- Supersedes stale recovery PR #3721.
- Current production SHA: `2fa5fa60f248a5f14d86426cb835c447ab291cd3`
- Netlify deploy: `6ac4aed9e166fa0008fa35c7`
- Production Release Readback: success.
- Production pricing contract: proven.
- Remaining failure: Production Source Snapshot browser locale verifier raised `TypeError: Cannot read properties of null (reading 'lang')` inside `page.waitForFunction`.
- Correction: route proof is bound to browser navigation commit; semantic locale checks execute only after the new document body is visible.
- Regression: `tests/brain-i18n-production-navigation-readback-v2.test.mjs`
- Closure: exact-HEAD gates → protected merge → current-main Production Source Snapshot + Production Release Readback both green.
