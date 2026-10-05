# Development ledger — historical reconciliation lane scope

- Date: 2026-10-05
- Failure: protected merge starvation for historical terminal reconciliation
- Cause: generic .github/workflows/ classification activated website/browser gates for a backend-only control-plane workflow
- Fix: classify .github/workflows/historical-terminal-reconciliation.yml as backend-only
- Regression: tests/brain-change-scoped-release-lanes.test.mjs
- Invariant: unrelated product lanes must not be activated by scoped control-plane workflows
