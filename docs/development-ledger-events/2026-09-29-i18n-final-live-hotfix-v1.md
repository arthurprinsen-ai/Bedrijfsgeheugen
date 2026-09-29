# 2026-09-29 — FINAL LIVE HOTFIX — NL/EN mobile switcher syntax

- **Obligation:** `powerhouse-green-assurance-borging-20260929`
- **Signal:** actuele `main` bevatte nog één corrupte legacy `MOBILE_LANGUAGE`-literal in `tools/site-shell/apply-i18n.mjs`.
- **Fix:** vervangen door de canonieke `mobileLanguage + '$&'` invoeging.
- **Prevention:** `tests/brain-apply-i18n-syntax-regression-v1.test.mjs` voert permanent `node --check tools/site-shell/apply-i18n.mjs` uit.
- **Learning:** `brain/learning/2026-09-29-i18n-route-aware-mobile-switcher-v1.json`.
- **Human docs:** `docs/changes/2026-09-29-i18n-route-aware-mobile-switcher-v1.md`.
- **Truth boundary:** niet LIVE_BEWEZEN vóór protected merge, exact production deploy en actuele NL→EN→NL browser-readback.
