# Development ledger — terminal release marker + mobile i18n v1

- Initial exact Netlify production SHA: `6417fa291ac08345369e1e143abf974fac54f0e4`.
- Production readback failure 1: index.html release marker differed from exact production commit.
- Production readback failure 2: visible mobile language select was missing on pricing.
- Recovery main SHA: `6200b6cf13aa09d058c92f02f061368e21013e03`.
- Netlify linked deploy `6ab69bce0feb69f4c4e7499e`: build error, exit code 2.
- Netlify exact-source deploy `6ab69c0ba6e5f541bdceaee8`: same build error, exit code 2.
- Root cause: malformed JavaScript in `tools/site-shell/apply-i18n.mjs`; a duplicate function body was embedded in an HTML replacement string.
- Fix: callback-based compact drawer injection + executable syntax/fixture regression.
- Regression: `tests/brain-terminal-release-marker-mobile-i18n-v1.test.mjs`.
- Terminal state: requires protected merge, exact-main Netlify deploy and green pricing/NL→EN→NL production browser proof.
