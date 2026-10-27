# Development ledger — backend lane install timeout

- Date: 2026-10-05
- Failure class: CI / protected-merge starvation
- Trigger: backend / backend remained in progress at "Install runtime dependencies for backend contracts"
- Root cause: unbounded silent npm install in .github/workflows/lane-backend.yml
- Fix: 20-minute job timeout, 8-minute install timeout, bounded fetch retries, visible install output
- Regression: tests/brain-ci-critical-path-acceleration-v1.test.mjs
- Expected invariant: dependency installation must either complete or fail terminally; it may never keep Required test non-terminal indefinitely.
