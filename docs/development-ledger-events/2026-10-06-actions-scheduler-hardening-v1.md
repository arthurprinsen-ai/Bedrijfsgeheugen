# Development ledger — Actions scheduler hardening v1

- Date: 2026-10-06
- Proven symptom: Required entered `pending` in `required-test-3975` after an in-place head refresh even though the concurrency group exposed no competing active member.
- Proven queue debt: historical queued pull-request runs from 2026-09-12 remained visible after their PR was no longer open.
- Fix: remove workflow-level Required concurrency; stale-head fail-fast; per-heavy-lane cancellation; orphaned queued/pending run cleanup in PR Janitor.
- Safety: open PR head SHA/ref ownership blocks cancellation; scan is bounded; only pull-request nonterminal queue states are targeted.
- Regression: `tests/brain-actions-scheduler-hardening-v1.test.mjs`.
