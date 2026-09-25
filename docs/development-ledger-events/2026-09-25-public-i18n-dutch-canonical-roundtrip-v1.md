# 2026-09-25 — Public i18n Dutch canonical roundtrip

- Fingerprint: `public-i18n-dutch-canonical-roundtrip-20260925-v1`
- Defect: EN → NL kon naar `/nl/*` navigeren terwijl Nederlands on-geprefixte canonical authority is.
- Root cause: runtime en static builder gebruikten een generieke `/<locale>/<route>` mapping.
- Fix: locale-aware canonical mapper: NL = unprefixed, EN = `/en/*`.
- Hosting: legacy `/nl` en `/nl/*` permanent naar de Nederlandse canonical.
- Regression: static authority test controleert runtime + builder + redirects.
- Production proof: echte browserroundtrip NL → EN → NL; `/nl/*` is expliciet verboden.
- Terminal state: pas LIVE_BEWEZEN na protected merge, Netlify production identity en groene production readback.
- Netlify production deploy `6ab6744ae51cac6be3a28a20` for `abdfd8d7...` failed during site build with exit code 2.
- Recovery on current main `efa43915...`: post-transform English-cache validation now runs immediately before localized route generation.
