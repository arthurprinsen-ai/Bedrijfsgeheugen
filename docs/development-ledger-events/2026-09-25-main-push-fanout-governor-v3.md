# Development ledger — main push fan-out governor v3

- Date: 2026-09-25
- Parent incident: GitHub Actions queue amplification.
- Successor blockers: stale one-line YAML regression, missing System Map skill registration, obsolete pricing timestamp/readiness assertions.
- Fix: semantic regressions + System Map registration + content-addressed/runtime-readiness alignment.
- Terminal state: pending protected merge and queue/current-main readback.

- Final structural defect found by semantic replay: `.github/workflows/content-growth-ci.yml` had an empty `push.branches` key and `main` incorrectly listed under `paths`.
- Repair: `push.branches: [main]`; `main` removed from paths; other five specialist workflows were re-read and already correct.
