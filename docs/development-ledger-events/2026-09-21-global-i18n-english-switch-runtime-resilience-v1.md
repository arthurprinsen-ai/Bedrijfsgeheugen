# Activity event — English switch translated no page text

- **Fingerprint:** `global-i18n-english-switch-runtime-resilience-v1`
- **Obligation:** `global-nl-en-i18n-v1`
- **Date:** 2026-09-21
- **Observed failure:** user could tap English, but the website text stayed Dutch.
- **Root cause:** the translation path was all-or-nothing. A non-bare JSON model response or one failed batch caused the whole switch to fail/revert; stale v1 cache entries could then keep bad English results.
- **Recovery:** tolerant JSON-array parsing, smaller isolated batches, partial-success preservation, no locale rollback on one failed batch, and a fresh v2 translation cache.
- **Regression evidence:** `tests/site-shell-global-i18n.test.mjs`.
- **Prevention:** language selection and translation delivery are separate concerns; selecting English must remain active while successful batches are applied, and one failed batch must not make the entire page look unchanged.
- **Terminal state:** open until protected merge and exact production readback.
