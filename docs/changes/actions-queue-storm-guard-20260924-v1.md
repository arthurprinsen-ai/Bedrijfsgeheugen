# GitHub Actions queue-storm prevention — 24 September 2026

The delivery control plane was observed with 19 workflow runs in progress and 121 queued. At the same time the repository contained 55 open pull requests.

## Root cause

`Powerhouse Delivery Recovery Supervisor` was allowed to run after every push to `main` and every five minutes. Each repository-wide pass inspected all open pull requests and could dispatch `Required test` and `Unified Brain Delivery` recovery runs. Under saturation, the recovery mechanism could therefore create more work than the Actions runners could drain.

## Permanent prevention

The supervisor now:
- is scheduled/manual only; a `main` push cannot trigger a repository-wide recovery scan;
- runs every 15 minutes instead of every five minutes;
- opens an Actions circuit breaker at 20 active/queued/pending/waiting/requested runs;
- recovers at most one PR per cycle;
- checks for already-active Required/BRAIN work before dispatching duplicates.

A regression in `tests/delivery-powerhouse-supervisor.test.mjs` asserts these invariants. Any future change that restores main-push fan-out, removes the circuit breaker, removes the one-PR budget, or removes duplicate suppression must fail CI.

The operating rule is: recovery automation must reduce backlog, never amplify it.
