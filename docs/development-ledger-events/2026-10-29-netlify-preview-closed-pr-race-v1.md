# 2026-10-29 — Portal preview check ends cleanly for closed PRs

- Canonical obligation: `ci-preview|netlify-closed-pr-race|20261029-v1`.
- Defect: after the alias fix the preview check still ended red on PRs that were merged while the run waited; the alias of a closed PR no longer serves the head SHA.
- Scope: one workflow, one regression test, known-error documentation, learning and change notes.
- Open PRs keep the full wait and fail on a real provider failure or timeout.
- Required next proofs: exact-head Required/CodeQL, protected merge, a green preview run on a PR that stays open.
