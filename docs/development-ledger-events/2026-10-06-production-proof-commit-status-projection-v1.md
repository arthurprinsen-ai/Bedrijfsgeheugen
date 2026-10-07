# Development ledger event — production proof commit-status projection v1

- Date: 2026-10-06
- Type: IMPROVEMENT / PREVENTION
- Obligation: `production-proof-commit-status-projection-20261006-v1`
- Trigger: merged PR #3994 could not be declared LIVE_PROVEN through the connector because post-merge push workflows were not returned.
- Root cause: connector visibility was narrower than the repository's production evidence surface.
- Action: project Source Snapshot and Release Readback lifecycle onto stable merge-SHA commit status contexts.
- Evidence: exact base merge SHA `62b8c91f39474887a3f691ffa3ab550a8876cd09`; regression in `tests/brain-production-promotion-observability.test.mjs`.
- Prevention: terminal agents consume exact-SHA commit statuses and fail closed when required production evidence is absent.
