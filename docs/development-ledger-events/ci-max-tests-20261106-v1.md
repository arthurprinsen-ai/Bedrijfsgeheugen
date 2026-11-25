# Testselectie-limiet naar 100 — 6 november 2026

Obligation: `ci-max-tests:portal-page-unblock-2026q4`.

`MAX_TESTS` in `scripts/ci/select-tests-for-changed-paths.mjs` van 40 naar 100, zodat een nieuwe portaalpagina (System Map raakt 43 tests) door `preflight` kan. De poort blijft fail-closed boven de limiet. Test: `tests/brain-changed-path-test-selection-20261105.test.mjs`. Geen migratie, geen scheduler.
