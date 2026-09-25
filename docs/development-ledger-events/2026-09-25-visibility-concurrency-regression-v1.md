# Development ledger — visibility concurrency regression v1

- Date: 2026-09-25
- Failure: BRAIN backend lane had 1/1555 failing test.
- Root cause: stale test asserted sequential viewport loop syntax.
- Product behavior: production checker kept complete route × viewport coverage and all semantic assertions.
- Fix: regression aligned to bounded viewport parallelism invariants.
- Terminal state: pending protected merge and post-merge readback.
