# Koppeling Studio — bewerken, bronbewijs en uitvoeringsmonitor

Datum: 22 november 2026. De oorspronkelijke Koppeling Studio blijft het enige beheeroppervlak. Doel: de nieuwe configuratie voor bron/ontvanger, richting en frequentie kan niet alleen worden aangemaakt, maar ook **later veilig worden aangepast**; de status komt uit uitvoeringsbewijs en niet uit labels of een sample-test.

## Functionele uitbreiding

1. Bestaande custom-bron→doelontwerpen krijgen **Bewerk richting en frequentie** in hun huidige overzicht. De Studio reconstrueert de bron, doelprovider, schema-/veldselectie, bestemming, datagebruik en transfer-policy uit de tenantgebonden definitie.
2. Bij openen van een bestaande verbinding vervalt elke eerdere activatie-/testclaim in de UI; de wijziging wordt bewust als **concept** opgeslagen via het originele `PUT /api/connectors/:id/draft`. De originele backend geeft een nieuwe versie zodra de inhoud daadwerkelijk verandert. Een provider-ID, template of bestemming kan niet stilzwijgend worden ingewisseld: daar is een afzonderlijke nieuwe koppeling met herautorisatie voor nodig.
3. De bestaande API valideert nu óók tijdens **PUT** expliciet dezelfde `normalizeTransferPolicy` als tijdens **POST**. Onbekende triggers, ongeldige intervallen, ontbrekende primary-/cursorkolommen en niet-aangeboden providers worden geweigerd. Bewijs voor de oude versie kan niet gebruikt worden voor de nieuwe.
4. **Bekijk echte synchronisatiestatus** haalt `GET /api/connectors/:id/health` op bij de bestaande tenant-geauthenticeerde connectorbackend. Het antwoord toont een versiegebonden beveiligingsbewijs, geen ruwe records.
5. De controle eist voor de status **SOURCE_RECORDS_VERIFIED**: `Active` configuratie, actueel tenant-ID, exact dezelfde connectorversie, een origineel `SOURCE_SYNCED` execution receipt met `PROVIDER_VERIFIED`, `tenantRecordReadback=true`, `sourceReadSuccess=true`, AFAS-provider en identieke SHA-256 in een bron-snapshot met dezelfde velden, recordaantal, omgeving/GetConnector en opslagdatum. Alle proof mismatches resulteren in **EVIDENCE_DUE** of alleen **PROVIDER_CONNECTION_VERIFIED**, nooit een verzonnen geslaagde synchronisatie.
6. Gewenste richting, trigger, frequentie en syncmodus worden apart getoond van **daadwerkelijke uitvoering**. Een ingestelde uur-/dag-/weekfrequentie wordt expliciet als *niet autonoom bewezen* weergegeven. De UI verzint **geen volgende run**, geplande job of SLA; er wordt geen tweede executor geïntroduceerd.
7. Health is read-only en tenantgebonden. De response bevat **geen bronrijen, tokens of klantgevoelige kolomwaarden**, alleen beperkte statusmetadata. De originele Supabase service-role opslag en relevante RLS blijven onveranderd.

## Beperkingen die waar blijven

- De originele AFAS GET-connector kan, met gebruikersautorisatie en bron-readback, werkelijk handmatig synchroniseren. Een echte ingelogde klantproef blijft apart te bewijzen.
- Custom providerdefinities (Salesforce, Exact, M365, Shopify, etc.) blijven `DESIGN_ONLY` tot hun adapters, OAuth/rechten en provider-to-destination receipts onafhankelijk zijn getest.
- De Studio **toont** gewenste intervallen, maar maakt nog geen daadwerkelijke cron/webhook/CDC-uitvoering. Een autonoom ritme wordt pas geactiveerd na aansluiting op de bestaande ONE BRAIN/Heartbeat-executor, met lease, idempotency en aantoonbaar destination readback en consumer-ACK.
- Bestaande AFAS-tokengegevens worden niet door de custom-editor gewijzigd of zichtbaar gemaakt. Echte AFAS-configuratie blijft in haar eigen expliciete providerautorisatieformulier.

## Acceptatiecriteria / regressies

- `tests/brain-connector-studio-proof-monitor-v1.test.mjs`: bronbewijs kan niet worden gespooft via teststatus, verkeerde tenant/versie, verkeerde velden/rijcount, hash mismatch, demo of lege provider; echte null/zero-waarden blijven alleen in originele brondata. Geen scheduled success zonder onafhankelijke executor.
- Update naar geldig interval produceert nieuwe conceptversie, zonder overgenomen activatie. Ongeldige intervallen, provider swap of weggelaten transferPolicy worden server-side afgewezen.
- Ingelogde gebruiker kan alleen de eigen source-health lezen. Geen providerrecord of token in monitorpayload.
- Browser bewijst dat beide nieuwe knoppen in de originele Studio aanwezig zijn. Exact-head Required, CodeQL, beschermde merge en exacte Netlify `ready` commit blijven verplicht.
- Gebruik geen nieuwe scheduler, bronwriter of datasetopslag. De uitkomst is een gecontroleerde **beheer- en bewijsverbetering**, geen uitrol van onbewezen provideradapters.
