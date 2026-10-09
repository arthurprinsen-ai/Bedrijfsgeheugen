# POWERHOUSE — Native daily blog live watchdog durable semantic closure

- Date: 2026-10-09; parent P0: #4198
- Existing workflow: .github/workflows/daily-blog-live-watchdog.yml; no second worker or cron
- Real regression trigger: live-proof candidate PR #4260, Required CI #37920738844 initially blocked because Brain learning, activity event, human change doc not included
- Remediation: dynamic four-file atomic proof bundle generated before git commit; changedFiles/allowedFiles and PR metadata refer to the exact same four paths
- Prevent duplicate date proofs by checking existing open date-keyed obligation, preserving source identity and protected automatic squash merge
- Existing public readback remains mandatory; only exact content ID/canonical/heading validated by tools/content-growth/live-readback.mjs may produce 'live' ledger state
- Tests: tests/brain-daily-blog-watchdog-proof-closure-v1.test.mjs
- Acceptance: Node regression suite, protected Required, CodeQL, merge, next naturally occurring watchdog proof candidate admitted; no false-green on social/email deliveries
