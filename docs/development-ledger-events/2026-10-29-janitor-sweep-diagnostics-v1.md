# Ledger event: Janitor-sweep telt skip-redenen

- Datum: 2026-10-29
- Event: `janitor_sweep_diagnostics_declared_v1`
- Scope: .github/workflows/powerhouse-repository-janitor.yml
- Schrijver: alleen CI-configuratie; geen gedragswijziging, alleen extra logregel
- Waarheid: branch-test; oorzaak van 0 verwijderingen blijft open RCA tot de run met tellers
- Invariant: verwijderen alleen bij exacte head-sha van een gemergde PR naar main
- Bewijs: tests/brain-janitor-bounded-cleanup.test.mjs
