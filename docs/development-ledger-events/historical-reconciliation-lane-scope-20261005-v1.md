# Development ledger — historical reconciliation lane scope

- Date: 2026-10-05
- Failure: protected merge starvation for historical terminal reconciliation
- Cause: unscoped historical reconciliation workflow/config were treated as shared executable delivery paths
- Effect: unrelated portal, website/browser and automation lanes were activated
- Fix: classify `.github/workflows/historical-terminal-reconciliation.yml` and `config/historical-terminal-reconciliation.json` as backend control-plane
- Regression: `tests/brain-change-scoped-release-lanes.test.mjs`
- Invariant: the complete historical reconciliation bundle activates backend + shared only unless another path independently owns another lane
