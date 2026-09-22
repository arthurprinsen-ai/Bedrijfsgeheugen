# Activity event — concurrent static locale translation

- **Fingerprint:** `global-i18n-static-build-concurrency-v1`
- **Obligation:** `global-nl-en-i18n-v1`
- **Date:** 2026-09-22
- **Observed issue:** the locale-route build remained in progress beyond the six-minute preview smoke window.
- **Root cause:** translation batches were still executed sequentially.
- **Recovery:** use a bounded worker pool of up to four concurrent translation batches, configurable through `STATIC_I18N_CONCURRENCY`, while preserving recursive failure isolation.
- **Evidence:** `tools/site-shell/build-localized-routes.mjs`, `tests/site-shell-static-locales.test.mjs`, GitHub run 35689543690.
- **Terminal state:** open until protected merge and exact production readback.
