# Development ledger event — 2026-10-22 mobile CLS attribution

- Event: `WEBSITE_VISUAL_DIAGNOSTIC_CANDIDATE`
- Obligation: `website|cls-attribution-exact-browser-proof|20261022-v1`
- Canonical fingerprint: `website|mobile-cls|en-blog-afas-api|20261022-v1`
- Parent: #4215; unrelated writer #4606 preserved
- Baseline main: `f627153ed569820917a2dc5787dd210613f0395e`
- Evidence: Required run 39740060787, rerun browser job 119868910211: mobile /en/blog/afas-api CLS 0.111 > 0.100; checkout succeeded on same rerun
- Diagnostic: `PerformanceObserver.entry.sources` previous/current rectangles, bounded memory/log output
- Source: `tools/site-shell/standalone-visibility-check.mjs`
- Test: `tests/brain-mobile-cls-attribution-20261022.test.mjs`
- Prevention: no guessed CSS root cause, never adjust CLS threshold, keep every sitemap route and viewport fail-closed
- Result: CANDIDATE only; CI, release and live mobile CLS proof not yet verified. No production mutation.
