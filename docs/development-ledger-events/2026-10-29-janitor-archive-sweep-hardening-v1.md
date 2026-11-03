# Ledger event: Archive-sweep hardening

- Datum: 2026-10-29
- Event: `janitor_archive_sweep_hardening_declared_v1`
- Scope: .github/workflows/powerhouse-repository-janitor.yml, tools/ci/branch-archive-sweep.mjs
- Schrijver: alleen CI-configuratie
- Waarheid: oorzaak van de tag-fout nog niet bewezen; die staat na de volgende run in het log
- Invariant: unieke branches worden nooit verwijderd zonder gelezen archive-tag
- Bewijs: tests/brain-branch-archive-sweep.test.mjs
