# Activity event — same-locale apply race cancelled English translation

- **Fingerprint:** `global-i18n-locale-epoch-race-v1`
- **Obligation:** `global-nl-en-i18n-v1`
- **Date:** 2026-09-21
- **Observed failure:** English was selected in production but Dutch menu/page text stayed visible.
- **Root cause:** the client used a global apply-run counter. A dynamic DOM mutation could launch a second same-locale apply while the first English request was still in flight, invalidating and discarding the first translation result.
- **Recovery:** replace per-apply invalidation with a locale epoch that changes only when the locale changes, and add deterministic English translations for canonical navigation/auth labels.
- **Evidence:** `assets/js/i18n.js`, `tests/site-shell-global-i18n.test.mjs`, production screenshot at 17:55.
- **Terminal state:** open until required gates, protected merge and production readback.
