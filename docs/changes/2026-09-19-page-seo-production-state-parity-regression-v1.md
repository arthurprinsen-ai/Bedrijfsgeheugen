# Website SEO cleanup and production-state parity

- Obligation-ID: github-cleanup-page-seo-v1
- Source issue: #1448
- Candidate PR: #2364
- Current-source cleanup removes blocked brand wording from Pricing and Product.
- Root-cause correction: the main paginacontrole workflow already built canonical production HTML in `$RUNNER_TEMP/site` for browser checks, but ran `seocontrole.py` against raw source files in the workspace.
- Result: broad menu/footer drift was a false positive whenever canonical shell projection differed from source markup.
- Fix: both page and SEO checks now inspect the same production-projected tree; SEO report/status are copied back only as workflow evidence/state.
- Regression tests fail if this production-state parity is lost.
- Status: RECOVERABLE_INCOMPLETE until exact-head website/SEO/Required/BRAIN/CodeQL gates, protected merge and production readback are green.
