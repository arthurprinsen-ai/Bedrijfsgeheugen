# Ledger event: Janitor archive-sweep

- Datum: 2026-10-29
- Event: `janitor_archive_sweep_declared_v1`
- Scope: .github/workflows/powerhouse-repository-janitor.yml, tools/ci/branch-archive-sweep.mjs
- Schrijver: alleen CI-configuratie; verwijdert branches en maakt archive/-tags in de eigen repository
- Waarheid: elke verwijdering heeft een reden (MERGED_EXACT_HEAD, CLOSED_PR_HEAD_KEPT, CONTAINED_IN_MAIN, ARCHIVED_THEN_REMOVED) en staat in janitor-runtime-actions
- Invariant: geen verwijdering zonder herstelbaar bewijs
- Bewijs: tests/brain-branch-archive-sweep.test.mjs
