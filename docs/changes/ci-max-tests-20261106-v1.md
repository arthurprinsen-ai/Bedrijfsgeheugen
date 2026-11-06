# Testselectie bij gewijzigde paden: limiet van 40 naar 100 — 6 november 2026

Wat: `MAX_TESTS` in `scripts/ci/select-tests-for-changed-paths.mjs` gaat van 40 naar 100.

Waarom: een nieuwe portaalpagina verandert de gegenereerde System Map (`platform/system-map/canonical-system-map.mjs`), die 43 bestaande tests lezen. Met limiet 40 meldt de poort dan `CHANGED_PATH_TESTS_OVERFLOW` en kan geen enkele portaalpagina meer door `preflight`. De poort blijft fail-closed: boven 100 faalt hij nog steeds, en elke geselecteerde test wordt gedraaid.

Test: `tests/brain-changed-path-test-selection-20261105.test.mjs` gebruikt `MAX_TESTS` zelf en blijft geldig.
