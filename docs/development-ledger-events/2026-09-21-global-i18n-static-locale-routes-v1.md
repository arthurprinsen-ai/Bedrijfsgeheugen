# Activity event — replace runtime whole-site translation with static locale routes

- **Fingerprint:** `global-i18n-static-locale-routes-v1`
- **Obligation:** `global-nl-en-i18n-v1`
- **Date:** 2026-09-21
- **Observed failure:** multiple production screenshots showed English selected while the document and navigation remained Dutch.
- **Root cause:** the bilingual site architecture depended on client-side translation of the Dutch DOM after load.
- **Recovery:** build deterministic `/nl/...` and `/en/...` HTML routes during the Netlify build, rewrite internal links into the active locale, add `lang`, canonical and reciprocal `hreflang`, and make the menu switch navigate to the corresponding route.
- **Dynamic content:** the runtime translator remains only as a fallback for DOM inserted after load on an English route.
- **Production safety:** unresolved English strings fail the production locale build rather than publishing a partially translated document.
- **Terminal state:** open until exact-head gates, protected merge, Netlify exact-SHA deploy and production readback.
