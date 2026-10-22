# Development ledger — 2026-10-22 canonical watchdog PR-comment 403

- Event: `WATCHDOG_PR_COMMENT_AUTHORITY_DENIED`
- Obligation and fingerprint: `delivery|failed-gate|watchdog-pr-comment-403|20261022-v1`
- Parent incident: GitHub #3742; previous routing correction merged as #4660
- Failed observation: [run 39811993147, job 119940435969](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147/job/119940435969)
- Evidence: exact GitHub endpoint `POST /issues/4656/comments` -> HTTP 403 `Resource not accessible by integration`; effective token `PullRequests: read`, `Issues: write`; uncaught throw after one Required dispatch
- Scope: existing `.github/workflows/required-gate-watchdog.yml`, script, shared classifier, original regression, Brain learning, human docs and append-only ledger
- Prevention: grant required PR comment permission; denied writes remain undelivered/red; bounded two attempts per tick; preserve detection, other PR loop, original scheduler and fail-closed gates
- Tests: canonical `tests/brain-required-failed-gate-owner-routing-v1.test.mjs`; exact-head Required + CodeQL + live watchdog readback pending; no false PROVEN claim
