# SEO Search-Intent / First-Time-Right — immutable candidate event — 5 november 2026

- Canonical website repo: `arthurprinsen-ai/Bedrijfsgeheugen`. Existing website/SEO owner only; new change candidate PR #5447, base `1fec0b4d6ece32000a199d3bd1bb317f51a62a6a`.
- External source readback: Search Console 1 Oct–2 Nov 2026 260 impressions/2 clicks vs September 429/11. 39 impressions for `afas webshop koppeling` incorrectly directed to cost blog (0 clicks, avg pos 95.4615).
- Cause/weakness: service source `afas-koppeling.html` reused cost-intent `bg-zoekwoord`, despite original unique owner registry. Cost article lacked explicit high-intent webshop contextual handoff.
- Bounded repair: restore AFAS service keyword; informational/price article retains cost keyword; qualifying webshop explanation and canonical link; two deterministic Node tests.
- Rejected gate proof #1: original Required run 42032530779 / hygiene job 127262299648: `PR_MACHINE_METADATA_INVALID` (missing obligation, lane, type, immutable base); corrected same PR metadata, no test bypass. 
- Rejected gate proof #2: original Required re-run hygiene job 127263395378: metadata admitted, next guard `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger,brain_learning,human_documentation`; required this ledger, adjacent human document, structured Brain learning in same lineage. Preserve both historical failed runs.
- Preview is not production; do not report live until Required and CodeQL green + protected merge + exact Netlify deploy + publicly read back relevant pages.
- Dedupe prevention: reuse original SEO source owner, original PR candidate and unique keyword routing; no second SEO executor, unapproved editorial publication, paid order or fake indexing/traffic.
- Measured outcome after 28/56 days, if provider sample sufficient: search query-to-service-page match, position and click lift, CTA and qualified lead attribution. If insufficient, preserve `INSUFFICIENT_EVIDENCE`.
- Fingerprint: `seo|afas|commercial-query-displays-pricing-intent-route|20261105-v1`.

- First localized-route preflight (Required #42033655855, job #127266299051) refused the new Dutch public copy because the static English cache had 6 missing strings. Same original branch adds `config/bg-static-i18n-en.d/2026-11-05-afas-search-intent-route.json` with deterministic English translations; offline strict locale gate remains enabled. Verify next exact-head preflight and independently published `/en/afas-koppeling` route, never bypass translation quality.
