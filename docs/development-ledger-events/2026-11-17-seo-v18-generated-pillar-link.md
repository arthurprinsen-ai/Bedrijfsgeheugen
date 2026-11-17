# SEO 17 november 2026 — de enige echte bron van de V18 koppelingspagina

- Parent https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4918
- Root cause in original preceding protected PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5972.
- Exact production deploy: `6afc9e8be81d6f20b617fb91` READY on original main `8e36bec964a32a16e1d71facbc4a79175ebea321` published 18:37:45 UTC.
- Independent public DataForSEO 18:38:12–13 UTC: AFAS original H3 `AFAS Lightspeed koppeling: webshoporders zonder overtypen` and contextual webshop link **LIVE**, but original `/systemen-koppelen` production had H1 `Koppelingen`, generic AFAS link, NOT the exact intended `Lightspeed-webshop naar AFAS` anchor.
- Source-of-truth defect: `tools/bouw-v18-views.mjs` reads V18 rebuilt homepage view and overwrites checked-in `systemen-koppelen.html` late in production. Stale checked-in HTML checks were a false signal for this generated route.
- Fix original V18 view registry `tools/v18-views-lijst.mjs` with one contextual internal /afas-koppeling link; original `tools/bouw-v18-views.mjs` renders it into the final generated view and fails the build if not present; `tools/v18-seo-context-links.mjs` validates unique internal routes and visible anchors.
- No new landing page, domain, canonical, H1 claim, artificially created visit, fake social/email publish, new worker, or analytics bypass.
- Bilingual cache includes the accessible nav description. Regression `tests/brain-seo-v18-generated-pillar-link-20261117.test.mjs`.
- Production closure: protected Required+CodeQL; exact current Netlify READY; independent provider public /systemen-koppelen showing exact target anchor; original source/Brain receiver ACK and traffic/lead effect remain separately open until independently verified.
