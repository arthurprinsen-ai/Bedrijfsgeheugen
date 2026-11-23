# Ledger event: Janitor ruimt squash-gemergde branches PR-gestuurd op

- Datum: 2026-10-29
- Event: `janitor_squash_sweep_declared_v1`
- Scope: .github/workflows/powerhouse-repository-janitor.yml
- Schrijver: alleen CI-configuratie; verwijdert branches via de bestaande Janitor-rechten
- Waarheid: branch-test; opruiming pas bewezen na de eerste Janitor-runs op main (branchtelling daalt van 3255)
- Invariant: verwijderen alleen bij exacte head-sha van een gemergde PR naar main
- Bewijs: tests/brain-janitor-bounded-cleanup.test.mjs, tests/powerhouse-one-loop-repository-janitor.test.mjs
