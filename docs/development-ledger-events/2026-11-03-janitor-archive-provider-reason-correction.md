# Development ledger — 2026-11-03 — Janitor archive reason projection

- Evidence: original GitHub Actions run 41603524034 / job 125809319702 / SHA 029c75ec42653d78648bd82fbcb6b4723c6d35f9; GitHub source logged 3 distinct `PROVIDER_PERMISSION_DENIED` tag-write HTTP403 errors. Original incident observer succeeded but existing ONE BRAIN occurrence incorrectly stored `archive_reason=UNKNOWN_OR_OTHER`.
- Root cause: original observer parsed the NDJSON for quota only, collapsing other verified provider reasons to unknown.
- Owner: existing-powerhouse-github-delivery-janitor. Obligation: `github|janitor-archive-observer|tag-permission-403-reason-lost|20261103-v1`. No competing writer or scheduler.
- Candidate: classify validated exact same-run+source-SHA action evidence; reject forged/stale/unknown; preserve separate quota reason and fail-closed native outcomes.
- Regressions: `tests/brain-janitor-archive-incident-readback-20261103.test.mjs` plus native Required/CodeQL/full BRAIN; no weakened gate.
- Outcome pending: protected merge and fresh original Janitor/ONE BRAIN readback. Actual provider tag-create HTTP403, portal projection, GitHub ghost queues still unresolved and remain red.
