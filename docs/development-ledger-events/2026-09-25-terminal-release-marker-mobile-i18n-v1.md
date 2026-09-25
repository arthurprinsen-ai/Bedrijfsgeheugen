# Development ledger — terminal release marker + mobile i18n v1

- Exact Netlify production SHA: 6417fa291ac08345369e1e143abf974fac54f0e4.
- Production readback failure 1: index.html release marker differed from exact production commit.
- Production snapshot failure 2: visible mobile language select was missing on pricing.
- Fix: final HTML release marker stamping + compact bgkop mobile-language injection.
- Regression: tests/brain-terminal-release-marker-mobile-i18n-v1.test.mjs.
- Terminal state: pending protected merge and exact-production browser readback.
