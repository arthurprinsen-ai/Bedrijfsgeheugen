# Original sitewide SEO methods and evidence coverage
The existing BG169 audit now requires exact unique sitemap-route coverage, checks declared hreflang self/return links only on observed targets, and exports 12 source-grounded method groups with explicit evidence boundaries. It remains the existing audit artifact, not a second crawler, agent, or scheduler. Broader techniques are selected and applied by the original SEO analyst and protected website writer. The 19 on-page diagnostics do not establish full crawl, indexation, field performance, authority, AI visibility or commercial outcome.

Source review, 2026-11-24:
- https://developers.google.com/search/docs/essentials
- https://developers.google.com/search/docs/fundamentals/get-started
- https://developers.google.com/search/docs/crawling-indexing
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/docs/crawling-indexing/website-testing
- https://web.dev/articles/vitals
- https://www.bing.com/webmasters/help/bing-webmaster-guidelines-30fba23a
- https://support.google.com/webmasters/answer/17010961

For every new method, require applicability, source date, baseline, coverage, reversible intervention, tests, protected release, independent provider readback and outcome/learning. Do not buy links, cloak, generate scaled spam, fabricate citations/reviews, infer provider measurements, or loosen private route and consent protections. Local regression: 9/9. Production and consumer evidence remain open. Existing shared skills/agent config have active release ownership; do not overwrite them.

## Follow-up: full production replay and restrictive robots
The original candidate ran over 295 actual sitemap URLs, all HTTP 200, with unchanged live deploy. Both locale login pages contain index and noindex tags; the English login was incorrectly listed. Root cause confirmed in the FINAL production tools/genereer-sitemap.mjs and existing browser snapshot: each read only the first robots meta. Both now consider all applicable tags; sitemap excludes noindex/none without changing any page privacy guard, browser also reads X-Robots-Tag from its navigation response. Dependency-free tests 11/11, including the original generator decision and browser expression replay. Full browser build and exact production still unverified. See https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6142#issuecomment-7125338987.
