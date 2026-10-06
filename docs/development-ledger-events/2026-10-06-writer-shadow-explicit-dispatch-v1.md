# Development ledger — writer shadow explicit dispatch v1

- Date: 2026-10-06
- Problem: every ordinary PR created a Repository Writer Candidate Shadow run that immediately skipped.
- Root cause: global pull_request trigger doubled as fallback discovery for four writers.
- Fix: explicit immutable Shadow dispatch from all seven canonical writers; Shadow becomes workflow_dispatch-only.
- Safety: exact PR/base/head/branch identity is verified before shadow execution; central writer gates remain unchanged.
- Regression: `tests/brain-writer-shadow-explicit-dispatch-v1.test.mjs`.
