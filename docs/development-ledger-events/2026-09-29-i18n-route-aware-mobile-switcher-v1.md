# 2026-09-29 — RECOVERY — Same-route mobile NL/EN authority

- Fingerprint: `i18n|mobile-switcher|same-route-authority|2026-09-29-v1`
- Signal: pricing exact-deploy proof passed, then NL→EN navigation timed out.
- Root cause: source-level mobile language injector used `/ ↔ /en/` for every route.
- Fix: derive canonical route from each file; preserve same logical page across NL/EN; rewrite stale existing switchers; strip locale directory when computing generated locale targets.
- Regression: `tests/brain-i18n-route-aware-mobile-switcher-v1.test.mjs`.
- Terminal requirement: fresh production browser roundtrip.

- **Syntax hotfix:** de eerste route-aware wijziging liet in één legacy compact-mobile pad een oude token in een stringconcatenatie staan. Hersteld en voortaan afgedekt met `tests/brain-apply-i18n-syntax-regression-v1.test.mjs`.
