# 2026-09-24 — Actions queue storm guard

- Fingerprint: `actions-queue-storm-guard-20260924-v1`
- Incident: 19 runs in progress and 121 queued
- Open pull requests observed during diagnosis: 55
- Root cause: repository-wide recovery supervisor on every main push plus a 5-minute schedule and multi-PR recovery fan-out
- Guard: no main-push trigger, 15-minute schedule, active-run circuit breaker at 20
- Recovery budget: maximum 1 PR per supervisor cycle
- Duplicate suppression: do not dispatch Required test or Unified Brain Delivery when equivalent active work already exists
- Regression: `tests/delivery-powerhouse-supervisor.test.mjs`
- Delivery PR: #2799
- Invariant: recovery automation must reduce backlog and must never amplify an already saturated Actions control plane

## Duplicate-obligation cleanup

- PR #2801: closed, SUPERSEDED by #2804.
- PR #2803: closed, SUPERSEDED by #2804.
- #2804 is the single canonical current-main recovery candidate for this obligation.
