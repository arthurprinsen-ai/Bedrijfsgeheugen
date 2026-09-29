# 2026-09-29 — RECOVERY — Duplicate mobile locale controls retained stale route

- **Fingerprint:** `i18n|duplicate-mobile-controls|stale-route-link|2026-09-29-v1`
- **Signal:** production pricing readback timed out on NL→EN while exact deployment and pricing interactions were already proven.
- **Root cause:** build-time i18n replacement was first-match-only; duplicate mobile language controls could leave one visible stale `/en/` href.
- **Fix:** global replacement of all existing mobile language switchers using the current route-aware canonical control; asset version advanced.
- **Regression:** `tests/brain-i18n-all-mobile-controls-same-route-v1.test.mjs`.
- **Truth boundary:** no functional-green claim until fresh production NL→EN→NL readback passes.
- **Owner:** Website/i18n + Whole Brain Reliability.
