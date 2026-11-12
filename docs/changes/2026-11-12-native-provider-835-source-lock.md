# 12 Nov 2026 — originele 835e productiemigratie in BRAIN-bronlock

## Geobserveerde oorzaak

Protected PR [#5681](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5681) is correct gemerged op `main:6f5300cb52f64057e26d025ad52a39cf43301cdf`; native Supabase heeft SQL-migratie `20261112211000_original_skipped_provider_reference_readback_handoff_v1` **eenmaal** toegepast. Productiequery bevestigt 835 toegepaste versies en de oorspronkelijke handoff-functie/code/ACL is actief; ONE BRAIN consumer-records zijn onafhankelijk correct **16/16** `OPEN / OVERDUE_PROVIDER_READBACK`, zonder een providerbericht opnieuw te verzenden. De oorspronkelijke *post-merge* BRAIN-run [43290248396](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43290248396) had echter 14 van 6452 tests rood omdat de oorspronkelijke Git source-lock nog 834 werkelijk toegepaste versies opsomde, terwijl `supabase/migrations` al 835 originele scripts bevatte. Daardoor faalde ook originele terminal [43290199939](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43290199939). Geen codefout of automatisch bewezen providerpublicatie.

## Herstel zonder het bewijs te verdraaien

De bestaande originele `supabase/migration-history.lock.json` behoudt alle 834 eerdere provider-identiteiten ongewijzigd en appendt **uitsluitend** productie-observatie `20261112211000 / original_skipped_provider_reference_readback_handoff_v1`, met onafhankelijke productietimestamp `2026-11-12T19:31:33.643581Z`. Vóór deze kandidaat is de volledige prefix expliciet vergeleken met de officiële `list_migrations` van het originele project: 834 van 834 namen en versies identiek, 835e exact éénmaal nieuw. Geen nieuwe SQL, recht, scheduler, import van branchdata of externe send. Historische regressies blijven streng `lock == executable SQL inventory` en toetsen huidige providerbron tegen onveranderlijke historische prefixes.

## Terminale acceptatie

Beschermde Required/BRAIN/CodeQL/Preview/merge en daarna opnieuw originele BRAIN-postmerge, terminal closure, en eventueel native BRAIN provider-consumer readback. Alleen deze lock/parity herstelverplichting mag groen bij werkelijk geverifieerde succesvolle controle. De 16 externe bericht-readbacks en 181 sociale leermetingen blijven OPEN totdat onafhankelijke providerbewijs bestaat. Parent #4198.
