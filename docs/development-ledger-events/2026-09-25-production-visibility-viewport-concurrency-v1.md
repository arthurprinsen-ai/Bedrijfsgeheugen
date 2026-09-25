# Development ledger — production visibility viewport concurrency v1

- Date: 2026-09-25
- Failure: Canonical brand shell live readback exceeded 480000ms at /security phone.
- Root cause: viewport sweeps were sequential despite route-level concurrency.
- Fix: bounded viewport-level parallelism with existing fail-closed total budget.
- Assertions preserved: HTTP reachability, visible header/main/H1, occlusion, main text, CLS.
- Terminal state: pending protected merge and production readback.
