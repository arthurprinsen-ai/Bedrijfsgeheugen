# Skill: Powerhouse Daily Full Connection Enrichment

Fingerprint: `powerhouse-daily-full-connection-enrichment-v1`

## Permanente regel
Iedere connectie in de canonieke Powerhouse-relatiegraph krijgt iedere kalenderdag een enrichment-pass. Alle reeds beschikbare en rechtmatig verkregen LinkedIn-, bedrijfs-, publieke web-, nieuws-, runtime-, opportunity- en outcome-informatie wordt dagelijks opnieuw samengebracht en geprojecteerd op de juiste persoon en het juiste bedrijf.

## Canonieke flow
`all ingested evidence -> person -> company -> customer -> opportunity/NBA -> action/outcome -> learning`

## Gedrag
- Alle connecties worden dagelijks meegenomen, niet alleen high-priority of trigger-based relaties.
- Nieuwe LinkedIn-engagement/profile-evidence kan naam, bedrijf en rol alleen verrijken wanneer de match op de bestaande LinkedIn-URL geldig is.
- Bedrijfsnieuws, externe signalen en runtime evidence worden via company/person entity matching gekoppeld.
- Beschikbare evidence wordt dagelijks op de volledige graph geprojecteerd.
- Dure externe discovery blijft bounded/prioritized; full-graph betekent niet dat elke connectie iedere dag afzonderlijk een dure externe zoekopdracht krijgt.
- Freshness, provenance, confidence en source evidence blijven behouden.
- Geen gevoelige persoonsinferenties, geen scraping/platform-bypass en geen parallel CRM.

## Runtime
- State table: `public.powerhouse_connection_enrichment_state_v1`
- Projection view: `public.powerhouse_connection_enrichment_v1`
- Refresh: `public.powerhouse_refresh_all_connection_enrichment_v1(date,integer)`
- Scheduler owner: bestaande `powerhouse-commercial-learning-v1`
- Uitvoering: set-based full-graph refresh in iedere bestaande commerciële cyclus. De huidige 23k+ connecties worden in één schaalbare pass vernieuwd; tussentijdse LinkedIn- en externe events blijven daarnaast direct doorwerken.

## Definition of done
Een dag is pas compleet wanneer `connections_enriched_today = connections_total` en `full_graph_daily_refresh=true`. Nieuwe evidence die later op dezelfde dag binnenkomt wordt bij de volgende bestaande commerciële cyclus opnieuw op de volledige graph geprojecteerd.

## P0 14 november 2026 — scheid contextverversing, adresverwerving en toestemming

De bestaande dagelijkse graph-pass verwerkt rechtmatig **reeds ingelezen** evidence; dit is niet hetzelfde als nieuwe e-mailadressen vinden. De originele `bg_connecties` houdt het canonieke contactrecord; `powerhouse_connection_enrichment_state_v1` houdt afgeleid bewijs. Geen nieuwe CRM, scheduler of sender.

- De oorspronkelijke identity-graph-owner (#138) en commerciële Heartbeat (#116) volgen dagelijks drie **aparte** ratio's: gedateerde contextreview / connecties, geverifieerde adresdekking / connecties, en gedateerde `email_authority`-review / connecties. Toon NULL/UNKNOWN voor niet geverifieerde externe providerverrijking; tel een gerecyclede dagelijkse contextsnapshot nooit als verse e-mailverrijking.
- De bestaande bron-/onderzoeksagent kan via de bestaande, geautoriseerde providerroute gericht een e-mailadres zoeken als een aantoonbare zakelijke reden, rechtmatige grondslag, bronrecht en doelbinding bestaan. Prioriteer echte zakelijke relatie en bedrijf; bewaar bron-URL, tijd, expliciete e-mailpublicatie/verkrijgingsgrond, bronbewijs, verificatiestatus, person/company-identiteitsmatch, confidence en bewaartermijn. **Geen** scraping, toegangsbypass, gegokte naam@bedrijf-adressen, gekochte onbevestigde lijsten, privacygevoelige inferenties of ongeautoriseerde nieuwe betaaldiensten. Is een bron niet toegankelijk: label `SOURCE_UNAVAILABLE`, registreer de oorspronkelijke owner, probeer andere toegestane reeds beschikbare bronnen en blijf op veilige volgende uitvoering.
- Een geverifieerd adres is **niet hetzelfde als verzendtoestemming**. Bewaar expliciete consent/legitimate-interest assessment, opt-out, suppressions, 14-daagse contactdruk en providerrechten gescheiden; de bestaande originele Gmail/composer beslist over verzending. Geen bulkmail, geen automatische Send op basis van gevonden adres alleen.
- De oorspronkelijke producer draagt alleen geautoriseerde bronreferenties en revisions over aan de oorspronkelijke ONE BRAIN consumer. Handoff vereist tenant, person_key, bron/revision, original owner, idempotency key, ingest receipt, `PROCESSED`-ack van de genoemde consumer, Heartbeat/Next Best Action en optioneel meetbaar downstream-resultaat. Een `ACK_RECEIVED` zonder verwerking houdt de oorspronkelijke verplichting OPEN.
- Bescherm `source_snapshot.email_authority` tegen overschrijven bij full/bounded refresh. Een oude `run_date` blijft oud; verlies of nieuw ontbreken wordt OPEN/retriable, nooit stilzwijgend groen. Dagelijkse eindcontrole: contextreviews compleet, authority-review compleet, provider-ingest en downstream-ACK expliciet bewezen of eerlijk UNKNOWN, tekort per oorspronkelijke owner met volgende veilige actie.
- Houd de bestaande crons actief bij herstelbare bronfouten; herstel met dezelfde P0 #4198 lineage, `brain_failure_registry`, skill-/regressiebewijs en beschermde productie-readback. Verifieer dat e-maildekking werkelijk toeneemt uit nieuwe betrouwbare bronnen; een databaseupdate of succesvol cronresultaat is daarvoor op zichzelf geen bewijs.
