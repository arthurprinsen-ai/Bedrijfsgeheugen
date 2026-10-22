# Powerhouse blog release recovery — 2026-10-22

- Obligation: `content-publication:2026-10-21:blog`
- Canonical PR: #4570; no second PR or scheduler.
- Fingerprint: `powerhouse-blog-2026-10-21|diverged-generated-publication-index|merge-conflict`
- Evidence: GitHub merge rejected HTTP 405 due to conflicts; main and branch each changed blog index, RSS and sitemap. GitHub Actions run 39834341009 failed `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger,brain_learning,human_documentation`.
- Root cause: concurrent publication writers diverged generated files; release lacked mandatory learning and documentation writebacks.
- Recovery: preserved October 22 main content and October 21 PR content in commits 49600e6, 9a3fbab, 619d13c; reconciled main via merge commit 98f58cf. Earlier commits protected existing PR history and final-copy approval.
- Prevention: canonical PR per obligation; no force pushes; merge generated publication entries without deleting other dates; enforce closure and CI.
- Regression: assert both dates appear once in blog index, RSS and sitemap; approval guard rejects unapproved final copy; required CI must succeed.
- Verification: CodeQL and Netlify preview succeeded on 98f58cf; required test failed; production readback NOT VERIFIED. Do not declare LIVE_PROVEN.
