# 2026-11-12 original EN contact broken functional utility href
- Fingerprint: `website|en-contact|nl-only-need-discovery-wrong-locale-href|20261112-v1`; parent #4198; original website gate #4447.
- Proven failure: protected PR #5678 postmerge Brand Shell run 43299724834, job 131467451001, browser scanned 279 public pages and 32,613 hrefs, one invalid `/en/contact`→`/en/behoeftecheck`; exact live SHA `6f0497afb07051cf06f62f38efdea59cf7507bf2`.
- Root cause: existing static and browser locale engines rewrite canonical NL-only need-discovery route into an unbuilt English route; original indexable sitemap correctly rejects it.
- Fix scope: original static English localization and existing browser i18n, one exact route guard only. Keep full canonical HTTPS link, no blanket utility exemptions, no extra agent.
- Regression: `tests/brain-english-need-discovery-href-20261112.test.mjs`, original `tests/brain-sitewide-href-integrity-20261112.test.mjs`, production 279-route browser sweep.
- Closure: protected exact-head Required/CodeQL → merge → Netlify CURRENT READY exact SHA → original Brand Shell postmerge and Brain delivery success. Candidate until then. Historical failed check preserved.
