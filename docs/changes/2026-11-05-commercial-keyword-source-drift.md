# SEO — generated keyword-owner and title drift (5 November 2026)

Provider live crawl found that the general API-integration service URL `/api-koppeling-laten-maken` was indexed-crawlable (HTTP 200, self-canonical) but displayed the **AFAS API** service title. The website's source `api-koppeling-laten-maken.html` says generic API service, while the legacy generator `tools/zoekwoorden.mjs` overrides the title to `AFAS API koppeling laten maken` and focus keyword to `afas api`. The canonical baseline, the SEO owner registry, and market-revenue map assign this route to `api koppeling laten maken`. This is a self-induced search-intent and buyer-expectation mismatch, not proof of a particular ranking penalty.

Same legacy generator drift existed for original buyer-intent owners `exact online koppeling`, `twinfield koppeling`, and `webshop koppeling mkb`. Fix the 4 keywords and the general API title in **one original source**; keep dedicated AFAS API article, AFAS service, NL/EN locale owner, canonicals, CTA, on-page copy, offers and indexability unchanged.

A new executable canonical regression test `tests/brain-seo-commercial-generated-keyword-owners-20261105.test.mjs` compares the generated overrides to `loadRegistry()` and `site/seo-baseline.json` and ensures the generic API title cannot impersonate AFAS.

Do not claim fully optimized SEO or #1. Require approved protected exact-head Required/BRAIN/CodeQL, static bilingual build, Netlify provider production SHA and independent rendered title/keyword/canonical/CTA readback. Then monitor actual GSC query→URL, organic clicks, verified qualified leads and sales after 28/56 days. Source: https://developers.google.com/search/docs/essentials and the direct original provider crawl (5 November 2026).
