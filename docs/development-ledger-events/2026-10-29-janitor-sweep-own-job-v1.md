# Ledger event: Branch-sweep als eigen job

- Datum: 2026-10-29
- Event: `janitor_sweep_own_job_declared_v1`
- Scope: .github/workflows/powerhouse-repository-janitor.yml
- Schrijver: alleen CI-configuratie
- Waarheid: bewezen door run van 13:43 UTC (150 verwijderd, conclusie cancelled door job-timeout)
- Invariant: de sweep kan de tijd van de bestaande Janitor-stappen niet meer opslokken
- Bewijs: tests/brain-branch-archive-sweep.test.mjs
