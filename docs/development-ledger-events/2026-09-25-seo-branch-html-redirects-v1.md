# 2026-09-25 — Branchepagina canonical redirects

- Fingerprint: `seo-branch-html-redirects-v1`
- Recovery PR: #2869; supersedes #2715.
- Root cause: extensionless canonicals existed without explicit legacy `.html` redirects.
- Fix: 10 permanent 301 redirects in `netlify.toml`.
- Regression: `tests/brain-seo-branch-html-redirects-v1.test.mjs`.
