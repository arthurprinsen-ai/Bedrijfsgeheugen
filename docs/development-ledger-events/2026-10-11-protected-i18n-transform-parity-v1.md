# Development ledger — protected static i18n parity

- Date: 2026-10-11
- Parent: P0 #4198
- Failure: STATIC_I18N_CACHE_INCOMPLETE (5 entries) even though publisher prepared a complete scoped cache
- Cause: protected preflight validated raw HTML, canonical cache prepared transformed HTML
- Fix: reproduce canonical transforms before the unchanged cache-only strict verification
- Files: .github/workflows/required-test.yml
- Regression: tests/brain-protected-i18n-source-parity.test.mjs
- Original publisher, provider rights and proof gates are unchanged
- Live blog proof still requires protected merge, Netlify and public readback

- Additional root cause: stale native PR event base SHA after concurrent protected-main merge
- Guard: newer metadata base is accepted only if verified descendant of event base and ancestor of both actual protected main and candidate head

