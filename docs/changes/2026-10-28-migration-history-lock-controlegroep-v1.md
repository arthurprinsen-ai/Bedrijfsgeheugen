# 2026-10-28 — Migration-history lock: drie productie-migraties geregistreerd

Obligation: migration-history-lock-controlegroep-20261028.

De integriteitstest `tests/supabase-migration-history-integrity.test.mjs` faalde op main omdat drie migraties die in de productie-registry staan ontbraken in `supabase/migration-history.lock.json`:

- `20261027195341` revenue_learning_evidence_timestamp_guard
- `20261028090000` bg_experiment_controlegroep_v1
- `20261028230000` bg_bedrijfsprofiel_v1

Alleen de lock-registratie is toegevoegd. Er is geen SQL en geen logica gewijzigd. De versies en namen zijn read-only gecontroleerd tegen `supabase_migrations.schema_migrations` van het productieproject.

Regressietest: tests/brain-migration-history-lock-controlegroep-20261028.test.mjs.
