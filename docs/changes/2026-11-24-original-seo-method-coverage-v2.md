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

Historical regression follow-up: after protected main #6139 reconciliation, original Required run 45352223230 reached changed-file regression tests and failed two old signature assertions. Same original candidate updates both assertions and adds executable replay that verifies the replacement navigation response supplies X-Robots-Tag; unrelated errors still fail closed. 21/21 affected tests passed; no weaker visibility/CLS gate. Production remains unverified.

24 Nov protected preview Required 45352776419: 294/294 sitemap routes observed and 34015 hrefs checked, 0 critical SEO errors in scoped rules, but 142 href errors all pointed to the intentionally excluded /en/inloggen. Correct exact localized functional destination in original link contract, not a sitemap exception or privacy relaxation. Negative tests retain unsafe and unknown-path rejection. Source candidate only; repeat protected browser gate and actual Netlify readback.
