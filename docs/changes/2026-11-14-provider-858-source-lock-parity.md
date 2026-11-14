# 2026-11-14 — Originele Supabase providerhistorie 858 ↔ source-lock 858

Oorspronkelijk incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

- Native Supabase providerproject `adhjwmvyoixzjtmiroln` rapporteerde 858 daadwerkelijk toegepaste migratie-identiteiten.
- Het originele `supabase/migration-history.lock.json` bevatte 857 identiteiten. De eerste 857 (versie, naam) zijn één voor één exact met de provider vergeleken: 0 afwijkingen.
- Uitsluitend de laatste provider-identiteit `20261114164500 preserve_contact_authority_on_connection_refresh_v1` ontbreekt in de lock. Het echte uitvoerbare bestand `supabase/migrations/20261114164500_preserve_contact_authority_on_connection_refresh_v1.sql` bestaat al en behoudt zijn oorspronkelijke code.
- Herstel: alleen dit paar append-only aan de originele source-lock en `captured_at` bijwerken naar de werkelijke verificatie. Geen nieuwe migratie genereren, geen SQL-heruitvoering, geen dubbele schedulers of productiegreen-claims.
- Regressie: originele `tests/brain-supabase-migration-lock-provider-20261029.test.mjs` plus `tests/supabase-migration-history-integrity.test.mjs`, protected Required/admission/CodeQL en onafhankelijk GitHub-main-readback. De oorspronkelijke bronconsumptie-PR #5786 blijft een **afzonderlijk nog niet toegepaste** wijziging; nooit als provider-applied registreren vóór echte migratie-readback.
- Oorzaak/preventie: de bestaande migratie-eigenaar controleert na iedere werkelijke providerwijziging volledige source-lock-pariteit op exacte versie+naam en borgt dit in dezelfde canonieke lineage. Niet testen omzeilen.
