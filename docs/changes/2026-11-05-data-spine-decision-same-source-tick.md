# 2026-11-05 — data spine blijft onterecht AMBER door stage-timing, bronaanpassing binnen origineel

## Onafhankelijke productieobservatie
13:44 UTC: `data-spine-watchdog` op AMBER, `missing_stages=['decision']`. Bestaande originele 10-minuten watchdog rapporteert werkelijk `unhealthy_sources=0`, guard PASS en bron-acties, -leerregistratie, -uitkomst op 13:41 UTC, measurement/readback 13:41 UTC; oorspronkelijke `decision` blijft 12:51 UTC uit de oude 30-minutenbrug. De acht echte lusfasen eisen dezelfde bronversheid; de oude halfuurlijkse controleroutine kan daarom niet de actuele 10-minutenbeslissing leveren. Overige lusstatus bij detectie 8 GREEN / 3 AMBER / 4 RED.

## Brongebonden oplossing
De originele geautoriseerde `public.powerhouse_data_spine_watchdog_v1(p_now timestamptz)` maakt bij de reeds bestaande broncheck nu óók de `decision`-receipt aan in exact `public.powerhouse_loop_assurance_receipts_v1`, hetzelfde `p_now` en dezelfde werkelijke `v_gaps`:
- 0 unhealthy sources → `decision_kind=VERIFIED_NO_SOURCE_REPAIR_REQUIRED`; bestaande, geverifieerde no-op actie blijft intact.
- >0 unhealthy sources → `decision_kind=ORIGINAL_SOURCE_REPAIR_REQUIRED`, bestaande guard FAIL, geen valse groene lus.
- `customer_outcome_verified=false`, `causal_learning_verified=false` blijven expliciet onwaar. Geen extra gegevensbron, tabel, worker, publicatie of scheduler, geen versoepeling van de huidige 10-minutenbron, security of business bewijsgrenzen.

De oude halfuurlijkse bronbrug blijft als historische onafhankelijke controle; de gezonde loop hangt voor een actuele beslissing niet langer van die tragere brug af.

**Releasegrens:** tests + protected merge + echte Supabase migration en `pg_get_functiondef` + volgende natuurlijke originele watchdog-uitvoering waar `decision` en `guard` van dezelfde bron-tick afkomstig zijn + volgende oorspronkelijke status-assurance. Geen claim dat de andere AMBER/RED lussen of 3.477 onverifieerbare kalibraties zijn opgelost.

Canonical incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
