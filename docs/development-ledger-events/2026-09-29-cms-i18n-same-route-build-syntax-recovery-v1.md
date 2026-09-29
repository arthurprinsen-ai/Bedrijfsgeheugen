# 2026-09-29 — CMS i18n same-route build syntax recovery

- Fingerprint: `cms-i18n|same-route|build-syntax-recovery|v1`
- Signal: production source snapshot for the same-route NL/EN change failed during Netlify build.
- Root cause: malformed JavaScript replacement expression in `tools/site-shell/apply-i18n.mjs`.
- Fix: restore `mobileLanguage + '$&'`.
- Regression: `tests/brain-cms-i18n-build-syntax-v1.test.mjs` compiles the build injector and guards the replacement contract.
- Contract cleanup: `tests/site-shell-global-i18n.test.mjs` now validates canonical link-based locale controls, not retired select markup.
- Required terminal evidence: protected merge → exact-main Netlify deploy → pricing interactions → same-route NL↔EN production round-trip.
- Truth boundary: do not mark green from passing source tests alone.
