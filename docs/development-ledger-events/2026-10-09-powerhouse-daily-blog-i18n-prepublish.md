# 2026-10-09 Powerhouse blog English cache closure

Incident: PR #4230 failed 23 static translation cache entries despite the article candidate existing.

Canonical owner: existing `.github/workflows/powerhouse-daily-blog.yml`; static compiler: `tools/site-shell/build-localized-routes.mjs`. A separate writer or direct production database mutation is not introduced.

Changes: per-date cache patch preparation on the active candidate branch; no overwrite of global cache; CI-only translation gate remains fail-closed; hourly recovery includes existing open PRs. Regression evidence: `tests/powerhouse-blog-i18n-prepublish.test.mjs`.

Proof still required: protected merge of structural PR, exact-main production readback; current article requires its own protected merge and Netlify publication. Do not mark either LIVE_BEWEZEN before those checks.
