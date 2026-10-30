# GA4 Data Spine: oorspronkelijke bron-eigenaar corrigeren — 30 oktober 2026

## Direct geverifieerde oorzaak
De bestaande productiebron `public.powerhouse_evidence_sources` heeft voor `source_key='ga4-analytics'` als `owner_component='bg-ga4-sync'`. De actieve officiële Edge-collector is al `bg-analytics-sync-composio`; de oude `bg-ga4-sync` retourneert bewust HTTP 410 `DEPRECATED`. Dit is een achtergebleven metadata-eigenaar, geen bewijs dat de echte collector niet draaide.

De originele `public.powerhouse_capture_ga4_batch_v1` trigger schrijft uitsluitend een echte nieuwe bronobservatie na `status IN ('IMPORTED','PARTIAL')` met `rows_total>0`. Deze niet-lege providerwaarheid blijft ongewijzigd. Geen status- of auditrecord kunstmatig groen maken.

## Klein en begrensd herstel
De bestaande registry-rij wordt door één idempotente, fail-closed migratie van `bg-ga4-sync` naar `bg-analytics-sync-composio` gezet. Andere bronwaarden `required`, `max_age`, `writer_contract`, bronobservaties, GA4 providerdata, tenant-/consentrechten, scheduler, calibrator en bestaande leerregisters blijven ongewijzigd. Een ontbrekende of onverwachte eigenaarswaarde breekt af. Geen directe productiewrite buiten beschermd migratiepad.

## Onafhankelijk providerbewijs en grens
De oorspronkelijke GA4 property `546874601`, meet-ID `G-912L0PB68G`: 29 oktober 0 oorspronkelijke providerregels; 28 oktober 1 org. rij. De aparte Windsor readback 30 oktober `linkedin.com / referral`: 1 sessie, 1 actieve gebruiker, 4 events, maar *geen* reeds geïmporteerde oorspronkelijke GA4-batch of bewezen post/lead/order. De bestaande collector rapporteert standaard `yesterdayUtc()`, dus de afgesloten 30-okt-rapportage kan pas bij de eerstvolgende natuurlijke 31-okt-collectorrun ontstaan. Bij GA4-reporting-lag niet uit een oude of lege batch een nieuwe sessie verzinnen.

De originele predictive control rapporteert 1.867 achterstallige forecastresoluties en 2.085 aparte niet-publieke calibratieverplichtingen. De originele `powerhouse_forecast_resolution_candidates_v3` toont nul matches. Geen afsluiting zonder exact onafhankelijke eerste-partij outcome-ID, tenant, forecast-ID en tijdvenster.

## Controle- en publicatiegrenzen
Regressie: `tests/brain-ga4-original-owner-metadata-20261030.test.mjs`. Eerst protected Required/BRAIN/System Map/CodeQL en originele migratieprocedure, daarna SQL read-after-write op `powerhouse_evidence_sources`, actuele niet-lege GA4-batch en Data Spine-readback. De 15-lussenstatus blijft op feitelijk bewijs gebaseerd. One Brain fingerprint hergebruiken: `powerhouse|ga4-calibration|provider-report-empty-and-private-outcomes-not-public-ai|20261030-v1`; parent issue #4198 en eerdere PRs #5207/#5208.
