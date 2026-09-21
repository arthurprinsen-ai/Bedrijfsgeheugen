# Activity event — core menu English was blocked by remote translation

- **Fingerprint:** `global-i18n-immediate-menu-translation-v1`
- **Obligation:** `global-nl-en-i18n-v1`
- **Date:** 2026-09-21
- **Observed failure:** mobile selector showed English but visible menu copy stayed Dutch.
- **Root cause:** local deterministic translations were only written after the remote translation pipeline completed.
- **Recovery:** apply canonical navigation/auth translations synchronously before remote translation; repeat that immediate pass after dynamic mobile-menu rebuilds.
- **Evidence:** `assets/js/i18n.js`, `tests/site-shell-global-i18n.test.mjs`, user screenshot at 18:16.
- **Terminal state:** open until exact-head gates, protected merge and production readback.
