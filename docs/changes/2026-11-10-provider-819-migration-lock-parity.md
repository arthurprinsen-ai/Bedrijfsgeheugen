# Original providergeschiedenis 819/819 — bronbehoud

10 november 2026. De originele, beschermde Supabase-productie bevat onafhankelijk vastgesteld 819 unieke `supabase_migrations.schema_migrations`-identiteiten. De 819e: `20261110073500_original_content_handoff_receipts_v1`, afkomstig uit protected PR #5554. De bestaande GitHub-bron heeft die SQL al, maar de provider-lock bleef op 818: zes historische Required-regressies faalden terecht toen PR #5543 op recente main werd bijgewerkt.

Deze bronherstel-PR voegt **alleen** dat reeds in productie toegepaste exacte versie/naam toe aan `supabase/migration-history.lock.json` en registreert het meettijdstip `2026-11-10T08:19:43.617348Z`. Bestaande 818 entries, projectidentiteit, SQL, ACL en scheduler blijven ongewijzigd. Geen provider-`apply_migration`, geen schemawijziging, geen sender en geen verzonnen resultaten.

Verificatie: exact 819 unieke lokale executables en exact 819 identieke provider-lockentries; protected Required, CodeQL, eventuele hosted Preview; protected merge; main readback. Pas daarna de oorspronkelijke PR #5543 opnieuw baseren op bijgewerkte main, opnieuw Required en Preview draaien en pas bij groene exact-head checks mergen. De twee onverzonden e-mailacties blijven `prepared` tot de oorspronkelijke geautoriseerde Gmail-sender eigen provider- en readbackbewijs geeft.

Preventieregel: een bewezen productiemigratie moet door de bestaande release-eigenaar apart worden teruggelezen naar de originele, onveranderlijke lock voordat opvolgende nieuwe migraties veilig door de admission-poort kunnen. Geen aanpassing aan de tests om ontbrekende providerhistorie te verbergen.

## Beschermde Supabase-preview opnieuw activeren zonder de check te omzeilen

De provider-instelling koppelt bron-only PR #5558 niet aan een Supabase Preview Branch. De kandidaat behoudt daarom de provider-lockreparatie en wijzigt daarnaast de **reeds bestaande, uitgeschakelde** `powerhouse-runtime-verifier-v1` functie: de HTTP 410-response vermeldt expliciet dat operationele waarheid uit de bestaande Heartbeat en provider-readback komt, niet uit deze diagnose. Het blijft een retired endpoint zonder DB-probe of publicaties. De bestaande backpressure-regressie test deze eigenschappen. Hiermee bevat de kandidaat ook een echte `supabase/functions/`-wijziging voor de officiële GitHub→Supabase previewroute. Alleen een onafhankelijk geslaagde preview telt; een skipped check blijft rood.
