# 11 november 2026 — oorspronkelijke Supabase-migratiehistorie naar 826/826

Origineel incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

Fingerprint: `powerhouse|migration|native-second-version-source-lock-drift|20261111-v1`

## Onafhankelijke providerwaarheid

Productieproject `adhjwmvyoixzjtmiroln` registreert **826 unieke version/name-pairs**, geobserveerd op 2026-11-11 09:48:29 UTC. Twee opeenvolgende toegepaste migraties hebben dezelfde naam `original_loop_assurance_fault_isolation_v1`, maar verschillende echte versies: `20261111093500` en `20261111094222`. De eerste heeft drie oorspronkelijke SQL-statements; de tweede bevat precies één SQL-statement dat **byte-voor-byte overeenkomt** met de originele beschermde SQL-bron. De reden waarom dezelfde bron twee keer onder een andere versie is aangeleverd, is nog niet onafhankelijk vastgesteld.

## Veilige reparatie in bestaande owner-lineage

De oorspronkelijke `supabase/migration-history.lock.json` bevat 824 oude, onveranderde providerregistraties. Fase 1 (deze beschermde PR) voegt uitsluitend de exacte SQL-bronmirror toe onder `20261111094222_original_loop_assurance_fault_isolation_v1.sql`, met de 824-registratielock bewust onaangeroerd voor de normale bronmigratie-toelating. Fase 2 is een afzonderlijke beschermde bronhistoriecorrectie waarin beide werkelijk toegepaste provideridentiteiten aan de lock worden toegevoegd tot 826/826, uitsluitend ná onafhankelijke providerverificatie. Dit is geen nieuwe databasefunctie, uitvoerder, scheduled check, eigen waarheidstabel, betaald actiepad of mutatie van de productiedatabase. De bestaande `powerhouse_refresh_loop_assurance_v1` wordt niet direct aangeroepen door deze source-correction.

Het originele #171-schema en de 15 lussen blijven onveranderd actief. De oorspronkelijke 433 OPEN content-/learning-overdrachten, twee oude `RESULT_UNKNOWN` reconciliatiejobs en 7 rode lussen mogen niet administratief worden gesloten. Providerfunctie en fault isolation zijn apart bewezen; echte klant→Brain→Heartbeat→CRO→uitkomst→learning zijn nog `EVIDENCE_DUE`.

## Acceptatie

Verifieer dezelfde protected HEAD in Required, BRAIN, CodeQL en native Supabase preview, en sluit met een beschermde merge plus onafhankelijke actuele `supabase_migrations.schema_migrations` 826/826 vergelijking. De native provider ledger is autoritatief en mag niet gereset, gedelete, teruggeschreven of vals geconstrueerd worden. Een extra bronbestandsversie mag geen tweede scheduler, worker, provideractie of uitvoeringsresultaat aanmaken.
