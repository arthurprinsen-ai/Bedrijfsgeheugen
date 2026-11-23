# 2026-11-03 — duplicate BRAIN verification prevention

- **Fingerprint** `github|brain-verification|main-indexed-run-missed-by-pr-head-filter|duplicate-cancel|20261102-v1` (existing issue #5332).
- **Observed** original verification #41527548036 cancelled when erroneous duplicate #41527826859 was dispatched for PR #5329; run indexed under main SHA, not candidate.
- **Cause** external head-SHA-only query missed first active flight; original PR-scoped cancellation was too aggressive for read-only verification.
- **Repair candidate** original terminal performs second main-indexed exact-title read and fail-closed provider response validation; original Unified Brain uses non-cancelling concurrency for `verification_only=true`. Preserve native source PR cancellation semantics and unchanged required gates.
- **Regression** `tests/brain-terminal-canonical-verify-only-dispatch-20261102.test.mjs` with main-SHA vs candidate-SHA fixture and cancellation guard.
- **Learning & skill** `brain/learning/2026-11-03-brain-main-indexed-singleflight-v1.json`, `powerhouse-continuity`.
- **Status** code candidate only. Required/CodeQL/full BRAIN and exact-head protected merge and fresh native readback due; no invented green outcome.
