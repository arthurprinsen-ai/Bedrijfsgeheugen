# GitHub watchdog owner-comment 403 recovery — 22 October 2026

- Live failure: [Required Gate Watchdog #39811993147](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147), job #119940435969, exact merged main `01af9f2a05794a170cd3fd63013db75a33e76268`.
- GitHub rejected `POST /issues/4656/comments` with HTTP 403 `Resource not accessible by integration` despite `issues: write`; one unhandled exception stopped remaining PRs.
- Repair in the **existing five-minute watchdog**: add `pull-requests: write`, not a second workflow or credential; bound to two owner-signal attempts per tick; catch and report per-PR 403; continue unrelated missing-Required dispatch; return nonzero whenever any handoff remained unproven.
- Regression uses an isolated mock provider: first PR comment 403; second PR missing Required still dispatches; process exits 1, not false green.
- Keep exact-head gates, no source-test retries, historical/shadow/canary, CodeQL, no bypass of CLS or tenant security. No autonomous code correction is claimed.
- Canonical incident fingerprint: `github|watchdog|owner-comment-403-recovery|20261022-v1`; new live-run completion and same-PR verified comment must be observed after protected merge before closing.
