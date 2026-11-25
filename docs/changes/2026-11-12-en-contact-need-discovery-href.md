# EN contact public href — preserve original NL-only need-discovery utility

Date: 2026-11-12; original P0 #4198, website production provenance #4447; obligation `website|en-contact|nl-only-need-discovery-wrong-locale-href|20261112-v1`.

Original Trusted Advisor #5678 protected merged and Netlify CURRENT READY `6f0497afb07051cf06f62f38efdea59cf7507bf2`. Original Product Release Readback and Portal V2 DOM readback are independently successful. A *separate* original Canonical Brand Shell postmerge 279-route browser sweep failed with exactly one real rendered href: `/en/contact` → `/en/behoeftecheck` absent from final sitemap. Correct public transactional need-discovery route is `https://www.bedrijfsgeheugen.nl/behoeftecheck`, noindex and registered as a utility. Do not hide this via a broad sitemap exemption.

Fix only both original locale writers (`tools/site-shell/build-localized-routes.mjs` and `assets/js/i18n.js`), preserving this exact canonical HTTPS noindex utility in NL and EN and its search/fragment. Update original browser-gate skill, BRAIN machine learning, targeted regression and human ledger. The source CTA already uses a full canonical URL; no second route/translators/executors, no auth or tenant change.

Acceptance: exact-head Required+CodeQL+browser/sitemap tests, protected merge, Netlify exact CURRENT READY SHA, independent original 279-route brand shell browser readback SUCCESS with no `/en/behoeftecheck` href, actual process/Brain ACK. Unrelated metadata/SEO warnings remain visible and are not zeroed. No CRO uplift claim.
