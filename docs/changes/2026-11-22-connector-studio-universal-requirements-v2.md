# Koppeling Studio V2 — universal connector requirements

**Datum:** 22 november 2026 · **Eigenaar:** bestaande Portal V2 / Koppeling Studio / ONE BRAIN / Heartbeat · **Status:** productcontract + eerste geïmplementeerde configuratielaag; **niet** alle provideradapters zijn live.

## Doel en niet-onderhandelbare kwaliteitsnorm

Een gebruiker moet zélf een betrouwbare verbinding tussen vrijwel ieder bedrijfs-, data- of bestandsplatform kunnen ontwerpen, autoriseren, testen, activeren en monitoren. De Studio maakt *geen* valse claims: een catalogus-item, ingevuld endpoint, sample-test, ingesteld interval, PR, actieve configuratie of zichtbare tabel is nooit voldoende bewijs van een werkende end-to-end datastroom. Een koppeling is pas operationeel na provider-authenticatie, echte records, juiste veldrechten, doelreadback, idempotente uitvoerings- en Heartbeat-bewijsvoering, en waar toepasselijk onafhankelijke consumer-ACK.

## Minimale functionele requirements

| ID | Eis | Gedrag / controle |
|---|---|---|
| CON-01 | Open providerregister | Categoriseer ERP, CRM, financiële systemen, service, HR, e-commerce, databases, marketing, bestandsopslag, generieke API's, SFTP, webhooks. Elke provider toont **ontwerp beschikbaar**, **read-only adapter**, **read/write getest**, **OAuth nodig** of **onbeschikbaar** — géén fictieve live status. |
| CON-02 | Eigen bron én eigen doel | Kies A en B onafhankelijk; de Datahub/Portal is optioneel. Verbied een onbeveiligde vrije URL als uitvoerbaar endpoint; domeinvalidatie, DNS-rebinding- en SSRF-bescherming verplicht. |
| CON-03 | Richting | A→B, B→A en A↔B. Bij twee richtingen: onafhankelijke rechten voor lezen/schrijven aan beide kanten, unieke sleutels, conflict- en verwijderbeleid en kringlooppreventie. Een ontwerp ≠ bewezen bidirectionele adapter. |
| CON-04 | Frequentie | Handmatig, 5/15/30/60 min, 3/6/12 uur, dagelijks, wekelijks; daarnaast webhook/event-driven en CDC waar provider dat ondersteunt. Minimaal abonnementsinterval en provider-rate-limits afdwingen. Toon kalender/tijdzone (Europe/Amsterdam), DST-gedrag, vakantie/onderhoud en geplande volgende run **alleen met echte scheduler**. |
| CON-05 | Syncmodus | Snapshot/full refresh, append-only of incremental upsert; verplichte stabiele primary key + mutation cursor voor incrementele upsert; checkpoint en schema drift detectie. Datums/cursors correct met UTC normaliseren, pagineren en grenswaarden niet verliezen. |
| CON-06 | Initial load | Opt-in geen historie / laatste 30 dagen / alle geautoriseerde historie. Toon preview van aantallen, tijd en kosten. Grote backfill vereist bevestiging, begrensde batches, hervatten en rollback. |
| CON-07 | Recordlevenscyclus | Bronverwijderingen standaard **nooit** automatisch doorgeven. Tombstone/archiveren of fysiek verwijderen alleen na expliciete goedkeuring, rechtmatigheid, doelrechten en readback. |
| CON-08 | Tweerichtingsconflict | Standaard handmatige review, inclusief veldniveauverschil, bronversies en audit. Source-wins / target-wins / newest-wins pas na provider- en klokvalidatie; geen 'last write wins' zonder expliciete keuze. |
| CON-09 | Schema en mapping | Introspecteer feitelijke bronschema's, datatypes, entiteiten, velden, keys; beschrijf betekenis, herkomst, kolomrollen, units, valuta, tijdzone, nulls en granulair niveau. Mapping/lookup/validatie versiegebonden, aanpasbaar en testbaar; geen arbitraire JavaScript-expressies of onbewezen AI-relaties. |
| CON-10 | Privacy en data sovereignty | Tenants gescheiden, least privilege, veldselectie, toestemming per bestemming, RLS, encryptie in transit/at rest, versleutelde secrets en rotatie, EU/beleid & subverwerkers controleren. Optionele portaaldata en AI-gebruik **apart**; modeltraining verboden tenzij daar ooit afzonderlijk toegestaan contract voor bestaat. |
| CON-11 | Provider-authenticatie | OAuth consent/PKCE/refresh/revoke, provider API-key en scoped tokens, mTLS/SSH-key waar relevant, secret Vault. Nooit tokens in clientconfig, browser storage, PR, logs of screenshots. Herautorisatie en verlopen rechten zijn herkenbare herstelstappen; gebruikersconsent nooit omzeilen. |
| CON-12 | Betrouwbaarheid | Idempotency key (tenant + connector + source revision / event ID + doel), geen duplicaten bij retry; checkpoint pas ná aantoonbaar doelreadback. Batchgrenzen, rate limits, backoff, timeout, circuit breaker, dead letter queue/review en veilige replay. |
| CON-13 | Status en monitoring | Per verbinding: concept, autorisatie nodig, test nodig, actief met ECHTE proof, degraded, gepauzeerd, fout, verwijderd. Toon provider bereikbaar, laatst ontvangen datum, aantal rijen, bron→doel-lag, schema changes, succesvolle en mislukte synchronisaties, retry, geverifieerd destination ID en volgende geplande run indien schedulerbewijs. |
| CON-14 | Observability en signaleringen | Freshness SLA, ontbrekende updates, afwijkende recordaantallen, ongeldige totalen, omzet/kwaliteit afwijkingen **alleen na bewezen KPI-definitie**, OAuth expiry, provider downtime, dubbele records en syncconflict. Signalering naar gebruiker met oorzaak, impact, herstelactie en onafhankelijke herstelreadback. |
| CON-15 | Veilig testen en uitrollen | Preview → dry-run → schema-/rechtentest → test-record target readback → canary met recordlimiet → activeren → monitoren → terugrollen. Externe writes met betekenisvolle impact krijgen expliciete goedkeuring. |
| CON-16 | Portaal- en ONE BRAIN-consumptie | Bronmetadata kan in portaal getoond; echte bronrijen pas met tenant, versie, consent, provider proof en server-readback. KPI pas na sleutel/grain/aggregation/period/quality-validatie. ONE BRAIN en Heartbeat krijgen unieke bronlineage en named consumer-PROCESSED ACK; geen parallelle schrijver. |
| CON-17 | Aansluitpatronen | Ondersteun uiteindelijk one-to-one, fan-in, fan-out, bulk, async events, webhook→queue, CDC, documentextractie en API-transacties. Fan-in heeft entity resolution; fan-out afzonderlijke destination receipts, foutafhandeling en autorisatie per doel. |
| CON-18 | Beheer en governance | Eigenaarschap, doelomschrijving, dataclassificatie, approver, financiële/sociaal-juridische risico-inschatting, DPA, retentie, export, versiebeheer, wijzigingsimpact, 4-ogen-goedkeuring voor risicovolle writebacks en expliciete ontkoppeling. |
| CON-19 | Kosten en limieten | Providerkosten, API-calls, datasetvolume, maandelijkse geraamde kosten, abonnementslimieten, quota, alerts, datatransfer/egress, performance & budgetguard. |
| CON-20 | UX & toegankelijkheid | Eénzelfde eenvoudige flow op mobiel en desktop, aanbevolen preset + geavanceerde opties, duidelijk leesbare bron→doel-tegel, geen dubbele navigatie, zoekbare aanbiedercatalogus, veldniveau-hulp, WCAG-toegankelijke bediening, altijd transparant wat werkt en wat nog niet. |

## Verplicht datacontract per koppeling

`tenantId / owner / source.provider / target.provider / direction / trigger / intervalMinutes / timeZone / syncMode / primaryKey / cursorField / dataSchemaVersion / transformationVersion / selectedFields / portalPages / businessPurpose / consent / conflictPolicy / deletionPolicy / initialLoad / retryPolicy / idempotencyPolicy / approvalPolicy / state / version / sourceRevision / executionId / providerReceiptId / destinationReadbackId / freshnessSLA / lastVerifiedAt / consumerAck`.

Instellingen en uitvoeringsbewijzen blijven strikt gescheiden; een configuratieversie verandert nooit zonder ongeldigverklaring van oud testbewijs. Providersecret is een verwijzing naar een geautoriseerde server-side secret, nooit client-zichtbare configuratie.

## Aanbevolen gebruikersflow

1. **Wat wil je bereiken?** Kies twee systemen (of vraag AI een *voorstel*; AI activeert niet).
2. **Wat stroomt waarheen?** Teken A → B of A ↔ B, kies entiteiten/velden en betekenis/doel.
3. **Wanneer en wat verandert?** Handmatig, interval, webhook/CDC; snapshot, delta/upsert of append; eerste backfill, verwijdering, conflict.
4. **Autoriseren en testen.** OAuth/API-key buiten browseropslag, bronschema echt ophalen, mapping controleren en veilig target-readback.
5. **Activeren en volgen.** Alleen volgens bewezen providercapabilities, planlimiet en goedkeuring; meet success, lag, cost, alerts en bronresultaat.
6. **Onderhouden.** Automatisch herstel alleen bij veilige transportfouten; review bij auth/schema/permission/conflict; lessons terug naar bestaande agents/skills en ONE BRAIN.

## Fasegewijze realisatie — geen catalogus = liveclaim

**Nu in deze wijziging:** meerleveranciers-catalogus en onafhankelijke source/target-ontwerpen; versiegebonden richting-, frequentie-, syncmodus-, key-, backfill-, conflict-, deletion-, owner- en business-purpose-keuzes; server-side validatie + fail-closed activation. Gegevens in de bestaande `connector_definitions.configuratie`, zonder nieuwe tenant store of parallelle scheduler. De **bestaande AFAS read-only/manual route** blijft de enige provider met native echte bronophaling; ook die is pas bewezen voor een klant na geslaagde echte autorisatie en readback.

**Volgende providerwaves:** Exact Online + Microsoft Graph (Outlook/SharePoint) + Salesforce/ServiceNow en veelgebruikte e-commerce/finance; daarna SQL/Postgres, BigQuery, Snowflake, SFTP en aangeleverde webhooks. Per adapter eigen OAuth/provider sandbox, echte records, partial failures, rate limits, pagination en destination readback; niet tegelijk als 'klaar' presenteren.

**Volgende schedulerwave:** koppel geselecteerde intervallen/webhooks en CDC aan de **bestaande** canonieke executor/Heartbeat met idempotente dispatch/lease en execution receipts. Er wordt *geen* tweede scheduler gestart. Pas na aantoonbare echte run mag `AUTOMATIC_CONNECTOR_EXECUTOR_NOT_VERIFIED` vervallen.

## Acceptatiecriteria

- Minimaal 35 herkenbare providers doorzoekbaar, bron- en doelkeuze onafhankelijk, met onderscheid tussen catalogus, configuratie en echte providerondersteuning.
- Een gebruiker kan A→B, B→A en A↔B kiezen, interval of event mode vastleggen en primary/cursor/retentie/conflictregels bewaren.
- Foutieve keys, arbitraire providers, negatieve/impossible intervals, geïmporteerde secrets en het verwijderen van versie-/privacybewijs worden server-side geweigerd.
- Ongesteunde reverse/bi-directionele writes, webhook-/CDC-aanroepen, automatische intervaljobs, deletes en backfills **kunnen niet live worden gezet** met alleen een sample-test of handmatig uitgekozen label.
- Voor een werkelijke provider: authorized source READ, selected data, target WRITE+readback indien ondersteund, version/tenant-bound execution receipt, privacyreadback; plus herstel na gedeeltelijke failure en zero-duplicate retry.
- Live pagina toont aantoonbare waarden, geen mock/KPI zonder contract. Verkeerde tenant, route, configversie en demo krijgen geen data.
- Required, CodeQL, browser, deploy exact commit, incidentlearning, agents & skills. Niet vóór onafhankelijke live-providerbewijzen groen melden.

## Externe referentiekaders

- Airbyte — sync modes en incremental upsert: https://docs.airbyte.com/platform/using-airbyte/core-concepts/sync-modes
- Airbyte — incremental cursor/key design: https://docs.airbyte.com/platform/connector-development/connector-builder-ui/incremental-sync
- Fivetran — ingestiefrequenties en plannen: https://fivetran.com/docs/core-concepts/syncoverview
- Workato — polling/webhooks en foutafhandeling: https://docs.workato.com/recipes/triggers.html en https://docs.workato.com/en/recipes/best-practices-error-handling.html
