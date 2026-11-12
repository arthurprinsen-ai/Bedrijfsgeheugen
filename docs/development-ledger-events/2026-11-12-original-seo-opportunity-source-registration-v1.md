# Originele SEO-resolver bronregistratie — 12 november 2026

**P0:** #4198  
**Fingerprint:** `seo|original-resolver-derived-source-registry-before-write|20261112-v1`  
**Oorspronkelijke eigenaar:** `powerhouse-seo-opportunity-resolver` (#105) → originele #175 → ONE BRAIN #140 → Heartbeat/portaal.

## Onafhankelijk geverifieerd incident
Een eenmalige uitvoering via de **bestaande #105-aanroep** gaf netwerkverzoek 29212 en HTTP 503 terug:
`SEO_SOURCE_OBSERVATION_WRITE:SOURCE_NOT_REGISTERED:seo-opportunity-intelligence`.

De originele `powerhouse_evidence_sources` had wel de ruwe providerbron `dataforseo-intelligence` en `gsc-search`, maar niet de afzonderlijke *afgeleide* SEO-opportunity-bron. De bestaande RPC weigert terecht een niet-geregistreerde bronnaam. De resolver schreef al 18 canonieke cacheprojecties (15→33, met oorspronkelijke 9-november provider-meetdatum) voordat de bronregistratie ontbrak; de gezonde afloop werd vóór de bewijswrite uitgegeven. Geen volledige uitvoering dus.

De oorspronkelijke bronarchivering #175 schreef daarna 20 bronklassen in revisie `080cf5af61f2a48e076846a4f5af5b4d652e1c84d66986f135b51227d10275da`. ONE BRAIN #140 accepteerde dezelfde revisie onafhankelijk; Heartbeat bevestigde exact dezelfde SHA. Vier bronklassen bleven niet volledig bewezen. `optimization_status` is geen uitgevoerd experiment en er is geen extra verkeer of omzet bewezen.

## Permanente reparatie, één bestaande keten
- Voeg **uitsluitend** `seo-opportunity-intelligence` toe in het bestaande `public.powerhouse_evidence_sources`: `source_class='projection'`, `required=false`, `max_age='7 days'`, `writer_contract='powerhouse-seo-opportunity-resolver-v1'`, oorspronkelijke eigenaar.
- Behoud afzonderlijke `dataforseo-intelligence` als echte externe providerbron. Een derived opportunity is geen nieuwe provider-kans, Google-ranking, menselijke sessie of betaalde order.
- De originele resolver controleert vóór enig schrijven of de source key, eigenaar en writer-contract exact geregistreerd zijn; een mismatch faalt vóór cache/upserts/forecast/gezondheids- of Brain-write.
- Verplaats de positieve resolver-health-write achter de gecontroleerde originele `powerhouse_record_source_observation_v1`-ontvangst. Registreer bij fouten oorzaak en correctie, nooit vals groen.
- Geen nieuwe planner, cron, bronregister, partnerprovider, URL, publicatie, OAuth-route of bypass. Beschermde migratie `20261112211600_original_seo_opportunity_source_registry_v1.sql`, bestaande GitHub–Supabase-productieintegratie, exacte code/providervisie en volgende bestaande consumer-ACK.

Regressie: `tests/brain-original-seo-evidence-source-registry-20261112.test.mjs`. ONE BRAIN-learning: `brain/learning/2026-11-12-original-seo-opportunity-source-registration-v1.json`.

## Terminal bewijs
Required/BRAIN/CodeQL + exacte Supabase Preview → protected merge → native migratieversie en bronregister readback → exact provider Edge code → originele #105 observatie → opnieuw originele #175 bron-SHA → #140 processed-ACK → Heartbeat/Portal → daadwerkelijk uitgevoerde veilige SEO/CRO-verbetering en 7/14/28-daags effect. Zonder dat laatste blijft commerciële uitkomst OPEN.

## Statuslog
- OBSERVED: request 29212 rejected 503 source-not-registered after 18 valid cached source projections; regression recorded.
- BOUNDED_CANDIDATE: guarded source registry + fail-before-write resolver code + original Brain/agent/skill update.
- RELEASE_DUE: no live proof until native provider source/migration readback; no claim of traffic or experiment success.
- ERROR_LEARNING: one registered derived source, no provider impersonation, no unverified source writes preceding a healthy completion receipt.
