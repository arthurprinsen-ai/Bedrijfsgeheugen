# ONE BRAIN — volledige historie uitlezen, geen stille overdrachtsuitval

Datum: 15 november 2026. Oorspronkelijk incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198 .

## Gecontroleerde fout
De originele `collectCompletionBackfillSnapshot()` haalt `workRows` en `recoveryRows` op via de bestaande `workStore.list()` en `recoveryStore.list()`. De originele REST-`listDispatch` vroeg `select=*` éénmaal op, zonder `limit`, `Range`, `Content-Range` of exact-count readback. PostgREST kan een lagere serverlimiet toepassen en de eerste 1.000 resultaten teruggeven. De werkelijke originele database bevat op 15 november 2026 **3.313 AgentWork/PENDING** en **1.055 RecoveryWork/RECOVERING**. Broncode heeft daarom een aantoonbaar volledigheidslek, maar dit is geen bewijs dat specifieke externe providerhandelingen dubbel of helemaal niet zijn uitgevoerd.

## Correctie in dezelfde keten
De oorspronkelijke service-only append-only REST-store leest beide types in pagina's van maximaal 500. Elke pagina vraagt `Prefer: count=exact`, `Range-Unit: items`, expliciete `Range`, stabiele sortering `created_at.asc,idempotency_key.asc`. De totale teller moet exact gelijk blijven; range-start, response-eind en rijenlengte worden gevalideerd. Als de server een kleiner maximum gebruikt, sluit de volgende aanvraag onmiddellijk op de laatst werkelijk ontvangen rij aan. Onbekende teller, gewijzigde bron tijdens iteratie, mismatch, onverwachte lege pagina, typefout, dubbele immutable sleutel of buitensporig aantal pagina's geeft een expliciete fout, nooit een stilzwijgend ingekorte werkvoorraad. De originele store, worker, recovery-agent en beveiligde GitOps-route blijven bestaan.

## Agents, testen, borging
De bestaande Reliability-agent krijgt volledige-historie-readback als verplichte taak; de bestaande recovery-skill legt de contract- en escalatieregel vast. De tests reproduceren historische voorraden van 1.201 AgentWork en 1.100 RecoveryWork, providerlimiet van 300/100, gewijzigde exact-count, ontbrekende headers en dubbele immutable sleutels. Bij die fouten blijft de originele verplichting open. Geen nieuwe scheduler, database-migratie, werkqueue, betaalde previewbranch, extern bericht of massa-afsluiting.

## Acceptatieketen
Required/CodeQL → beschermde merge → exacte Netlify-productie-SHA → eerste originele natuurlijke `Outcome Obligation Sweep` / completion-supervisor-collect met aantal teruggelezen rijen = source exact count → echte individuele evidence-/consumer-/providerreceipts → Heartbeat/resultaat → leren. Test-succes of registratie van 4.368 werkregels maakt de historische verwerking niet automatisch groen.
