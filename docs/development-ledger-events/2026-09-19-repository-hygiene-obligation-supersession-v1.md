# Repository hygiene — explicit obligation supersession

- Date: 2026-09-19
- Type: IMPROVEMENT / RECOVERY
- Fingerprint: `github|hygiene|explicit-obligation-supersession|v1`
- Signal: current-main successor PRs could coexist with explicitly superseded predecessors, causing duplicate CI and WIP.
- Root cause: hygiene only auto-closed known title-based candidate families.
- Fix: generic exact Obligation-ID + explicit numeric Supersedes contract; newer successor closes predecessor within bounded resource budget.
- Safety: no similarity inference; different obligations or missing/invalid Supersedes remain protected.
- Regression: `tests/brain-repository-hygiene.test.mjs`.
- Resource effect: fewer duplicate workflow runs, API calls, queued jobs and stale PRs.
- Production status: pending exact-head gates, protected merge and main readback.
