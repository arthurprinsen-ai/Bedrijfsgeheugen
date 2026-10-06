# Development ledger — writer shadow explicit dispatch v1

- Date: 2026-10-06
- Obligation: writer-shadow-explicit-dispatch-20261006-v1
- Problem: all PRs created a Repository Writer Candidate Shadow run that was usually skipped.
- Fix: seven writer producers explicitly dispatch shadow verification after exact PR base/head/ref readback.
- Removed: broad pull_request trigger on repo-writer-candidate-shadow.yml.
- Preserved: read-only permissions, path policy, immutable artifact evidence and central writer gates.
- Regression: tests/repo-writer-shadow.test.mjs.
