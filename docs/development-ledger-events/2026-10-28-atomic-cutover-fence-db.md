# 2026-10-28 — Fence-transactie in de Brain-opslag voor de growth learning-store

Obligation: atomic-cutover-fence-db-20261028.

Migratie met `growth_insert_if_absent_with_cutover_fence` en `growth_cutover_set_state` op `public.brain_records` (geen nieuwe tabel), plus een adapter die het databaseantwoord ongewijzigd doorgeeft. De fence staat bij oplevering op INACTIVE.
