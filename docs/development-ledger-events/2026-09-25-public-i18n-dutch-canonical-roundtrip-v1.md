# 2026-09-25 — Public i18n Dutch canonical roundtrip

- Fingerprint: `public-i18n-dutch-canonical-roundtrip-20260925-v1`
- Defect: EN → NL kon naar `/nl/*` navigeren terwijl Nederlands on-geprefixte canonical authority is.
- Root cause: runtime en static builder gebruikten een generieke `/<locale>/<route>` mapping.
- Fix: locale-aware canonical mapper: NL = unprefixed, EN = `/en/*`.
- Hosting: legacy `/nl` en `/nl/*` permanent naar de Nederlandse canonical.
- Regression: static authority test controleert runtime + builder + redirects.
- Production proof: echte browserroundtrip NL → EN → NL; `/nl/*` is expliciet verboden.
- Terminal state: pas LIVE_BEWEZEN na protected merge, Netlify production identity en groene production readback.
- Promotion PR: #2924 via de bestaande Production Source Snapshot authority.
- Promotion gate finding: stale tests voor 3 retries en productie-runtime-fallback conflicteerden met actuele bounded-retry en fail-closed contracten.
- Recovery: alleen de verouderde testverwachtingen zijn aangepast; productcode en veiligheidsinvariant zijn niet verzwakt.
- Prevention: regressietests volgen de canonieke semantiek, niet een verouderde literal of eerder teruggedraaide policy.
- Delivery control-plane recovery: dezelfde canonical PR is op de nieuwste main gereconciled; geen duplicate PR of alternatief deploypad.
