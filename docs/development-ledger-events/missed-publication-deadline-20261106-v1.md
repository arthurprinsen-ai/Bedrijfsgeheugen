# Gemiste publicatiedeadline zichtbaar — 6 november 2026

Obligation: `missed-publication-deadline-20261106-v1`.

Alleen-lezen `powerhouse_missed_publication_v1` meldt elk kanaal/dag na de deadline zonder PUBLISHED of later, met eigenaar. De bestaande orchestrator toont het bij elke run. Deadlines (blog 09:00, linkedin_company 10:00, linkedin_personal 08:00, instagram 18:00, nieuwsbrief 08:00 Amsterdam) zijn een voorstel van Claude en moeten door Arthur worden bevestigd. Regressie: `tests/brain-missed-publication-deadline-20261106.test.mjs`.

Aanvulling: bronslot `supabase/migration-history.lock.json` bijgewerkt met de al toegepaste migratie `20261106103000_powerhouse_missed_publication_v1` (productie-readback: 811 migraties, versie aanwezig). Geen herhaalde uitvoering.
