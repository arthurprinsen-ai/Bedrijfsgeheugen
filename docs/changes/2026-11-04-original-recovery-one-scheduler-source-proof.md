# Powerhouse ONE BRAIN–Heartbeat: één oorspronkelijke hersteluitvoering

**Datum:** 4 november 2026. **Eigenaar:** bestaande ONE BRAIN / Powerhouse recovery owner en de oorspronkelijke Heartbeat runtime-mux-eigenaar. **Centraal incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Vastgestelde overlap
De oorspronkelijke pg_cron #171 voert iedere vijf minuten de bestaande watchdog `powerhouse_execution_resilience_watchdog_v1` en de reconciliatiewerker `powerhouse_reconciliation_worker_v2` uit. De onlangs via PR #5386 toegevoegde pg_cron #184 roept dezelfde twee bestaande functies daarnaast iedere vijftien minuten aan. De afzonderlijke advisory locks voorkomen niet dat beide planners op verschillende momenten dezelfde logica starten. Claims worden op bronrijen vergrendeld en veilig herhaald, maar de extra planner is niet nodig. 

De vorige bronreparatie #5381 rapporteert het onderscheid tussen 307 afgeronde crononderzoeken en 306 expliciet nog onbewezen hersteluitkomsten. Dat moet wel in de oorspronkelijke, natuurlijke Heartbeat-uitkomsten terechtkomen, zonder een extra planner.

## Kleine, gecontroleerde architectuurcorrectie
Bestaande `public.powerhouse_runtime_mux_task_v1`: neem bij `terminal-autonomous-reconcile` uitsluitend de oorspronkelijke JSONB-uitkomst op, controleer het exacte contract `terminal-autonomous-reconciler-v2`, lees de al afgeschermde `powerhouse_recovery_review_truth_v1()` en voeg die in de bestaande `task_results` toe. De status `ok=true` is alléén uitvoeringssucces; expliciet `recovery_provider_resolution_proven=false` blijft zichtbaar. Bij ontbrekend bronbewijs wordt de bestaande taak fail-closed. De oorspronkelijke `one-brain-reconcile` foutafhandeling en alle andere taken blijven ongewijzigd.

De migratie stopt uitsluitend de exacte bestaande #184 wanneer de oorspronkelijke #171 actief en juist geconfigureerd is, er precies één oorspronkelijke overbodige hersteljob bestaat en naam/schedule/SQL-command exact matchen. In alle andere situaties faalt de beveiligde migratie zonder schedulers te wijzigen. De afgeschermde oorspronkelijke recoveryfunctie blijft bestaan voor geautoriseerde diagnose. Geen nieuwe cron, agent, queue, eigenaar, media, providerkosten of secret.

## Verifiëren, experimenteren en leren
Voormeting: 2 planners die dezelfde watchdog/worker uitvoeren; 307 onderzoekrecords afgerond, 306 werkelijk herstel onbekend. Controleer na een beveiligde source release: native productie `pg_cron` #171 actief, #184 afwezig, service-role-only ACL, en minimaal twee natuurlijke #171-uitvoeringen met geaggregeerde bewijsvelden. Meet betrouwbaarheid, ontbrekende receipts en expliciet onbewezen bronuitkomsten. De bestaande originele eigenaar registreert oorzaak, bewijs, owner, herstel, regressie en preventie in ONE BRAIN en portaal. De 306 historische provideruitkomsten blijven open totdat ieder afzonderlijk onafhankelijk is bewezen.

**Bronstatus:** kandidaat totdat exacte Required/BRAIN/CodeQL/native preview, oorspronkelijke lease, beschermde merge, productie-readback en twee natuurlijke runs slagen. Geen onterechte groene status.
