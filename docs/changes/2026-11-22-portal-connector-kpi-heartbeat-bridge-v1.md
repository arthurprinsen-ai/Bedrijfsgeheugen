# Portal V2 → Koppeling Studio → oorspronkelijke Heartbeat: veilige KPI-bronroute

Datum: 2026-11-22
Owner: originele Koppeling Studio (#4215) en Portal V2 → ONE BRAIN → Powerhouse → Heartbeat (#4547)
Fingerprint: portal-original-connector-kpi-bridge-v1

## Werkelijke technische wijziging

1. **Klant kiest de bron per KPI-regel** in de bestaande Portal V2-spraak- en signaleringsdialoog: een expliciet ingevoerd portaalveld of een geactiveerde, voor de KPI-pagina en bronvelden toegestane koppeling. De keuze wordt met de bestaande geauthenticeerde DomainState/BusinessInput-write en server-readback opgeslagen, nooit in een parallelle bronstore.
2. **Koppeling Studio ondersteunt de 8 KPI's** voor bronroute-ontdekking, inclusief Mensen en Processen. De status blijft eerlijk: configuratie of veilig TEST_PASSED bewijst geen actuele waarde.
3. **Originele vijfminuten-Heartbeat** leest alleen voor de laatste expliciet consented tenant-laag de bestaande `connector_definitions`, `connector_executions` en `powerhouse_source_observation_v1` in kleine gebonden batches. Het maakt geen nieuwe cron of sender. Bij 0 verbindingen doet het geen connectorqueries.
4. **Fail-closed bewijsjoin:** één `source_type='connector-kpi'` gemeten record met `contract='original-connector-kpi-readback-v1'` heeft dezelfde tenant, connector-ID, exacte active definitieversie, bronveld, KPI-mapping, bronrevisie, connector-execution-ID, provider-readback-ID en legale veld-/pagina-/data-use-autorisatie als een afzonderlijk opgeslagen `connector_executions` record met status `LIVE_INGEST_VERIFIED`, `proofLevel='LIVE_PROVIDER_READBACK'`, bronophaling en target-readback. Voor toekomstige provider adapters is dit het ingestiecontract; `TEST_PASSED`, metadata en demo-/voorbeeldvelden blijven afgewezen. Waarden ouder dan zeven dagen, toekomstige bronnen, pauseregel, verlopen versie, geblokkeerde review en cross-tenant ontvangen geen drempelsignaal.
5. Een per-gebruiker ingestelde bron zonder geldig bewijs wordt **niet** stilzwijgend vervangen door een getal uit de portaalvelden. De oorspronkelijke Heartbeat kan een ontbrekende-bronregel detecteren, maar geen omzetafwijking op een ongeverifieerd getal. Ook het browseroverzicht laat alleen `bronbewijs-open` zien totdat er echte serveruitkomsten zijn.
6. De bestaande tenant-afgeschermde bewijslijn bevat tellingen `connectorRuleCount` en `connectorMeasurementsMatched` plus of een trigger uit portal of connector kwam. Er worden geen externe financiële waarden of provider-payloads teruggegeven. Dit zijn oorspronkelijke OBSERVED-registraties, geen claim van onafhankelijke provider-Audit, data-actualiteitscertificering, berichtenlevering of business-outcome.
7. Leermodel, agent/skills en regressie vastgelegd in dezelfde bestaande lineage.

## Productiestatus en expliciete grens

Op de laatste databasecontrole stond `connector_definitions=0`, `connector_executions=0`, `powerhouse_source_observation_v1=0`, en waren er 0 aangemaakte klantsignaleringsregels. Er is daarom **geen** echte AFAS-, Exact-, Salesforce- of andere providerbron die nu onafhankelijk een productie-KPI levert. Deze release bouwt en beveiligt de **consumer/readback**-keten; hij creëert geen provider-OAuth, nieuwe provideradapter, geautoriseerde credentials of fictief `LIVE_INGEST_VERIFIED`-receipt. Het ingestiecontract blijft bij de bestaande connectors-/Engineering-owner, en moet met een werkelijke, geautoriseerde API-bron en onafhankelijke provider-readback worden gevoed.

Volledig GREEN vraagt per bedoelde provider: echte autorisatie, source-side read, schema mapping, persistente en onafhankelijke brondatabase-readback, aktuele bronrevisie en opt-in, 2-tenant/security test, natuurlijke Heartbeat-run en geauthenticeerde Portal V2-readback. E-mail/push en zakelijke acties hebben eigen consent/suppression/provider-ID/approval/effectcontrole en blijven OPEN. Nooit een dummy provider-observatie of `TEST_PASSED` herlabelen om aantallen groen te maken.

## Tests

`tests/brain-portal-original-connector-kpi-bridge-v1.test.mjs` en bestaande portal + originele Heartbeat regressies inclusief privacy, revocation, stale, source version, no-portal-fallback en no-external-delivery.
