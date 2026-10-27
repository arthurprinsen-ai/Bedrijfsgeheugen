# Development ledger — required status context uniqueness v1

- Date: 2026-10-06
- Incident: protected branch accepted an unrelated green `test` job while the canonical Required test later failed.
- Root cause: duplicate GitHub Actions job names across workflows.
- Structural fix: unique job ids for all non-authoritative workflows; only `required-test.yml` retains `test`.
- Regression: `tests/brain-required-status-context-uniqueness-v1.test.mjs`.
- Safety: no branch protection bypass and no required check removal.
