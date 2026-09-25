# Development ledger — production visibility viewport concurrency v1

- Date: 2026-09-25
- Failure: Canonical brand shell live readback exceeded 480000ms at /security phone.
- Root cause: viewport sweeps were sequential despite route-level concurrency.
- Fix: bounded viewport-level parallelism with existing fail-closed total budget.
- Assertions preserved: HTTP reachability, visible header/main/H1, occlusion, main text, CLS.
- Terminal state: pending protected merge and production readback.

- Lineage metadata lesson: do not declare a closed non-authoritative predecessor in `Supersedes` merely to narrate history; that intentionally re-enters the predecessor into admission conflict evaluation and can yield `BLOCKED_LINEAGE_AMBIGUOUS`. Historical context belongs in prose, while machine supersession is only for an actually superseded candidate lineage.
