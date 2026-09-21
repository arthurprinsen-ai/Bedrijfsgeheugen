# Activity event — English selected but website remained Dutch

- **Fingerprint:** `global-i18n-translation-provider-resilience-v1`
- **Obligation:** `global-nl-en-i18n-v1`
- **Date:** 2026-09-21
- **Observed failure:** production showed English selected while visible website/menu copy remained Dutch.
- **Root cause:** backend/provider translation batches could all fail; the client intentionally preserved English selection but swallowed batch failures, creating a silent no-op.
- **Recovery:** move UI translation to dedicated Claude Haiku 4.5, retry failed batches as groups of five, preserve successful batches, and throw `translation_unavailable` when zero missing strings translate.
- **Evidence:** `netlify/functions/_brain-ai.mjs`, `assets/js/i18n.js`, `tests/site-shell-global-i18n.test.mjs`, user screenshot at 17:38.
- **Terminal state:** open until required gates, protected merge and production readback.
