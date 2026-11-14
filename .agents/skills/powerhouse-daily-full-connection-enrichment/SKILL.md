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

## 14 november 2026 — originele publieke zakelijke adreskandidaat in één lus

De enige schrijvende externe research-owner is de bestaande `powerhouse-relationship-public-research`, vanuit commerciële cron #116. Deze hergebruikt maximaal één openbaar HTTPS-bedrijfspagina-resultaat per oorspronkelijke interne researchactie uit de **bestaande** SERP-uitkomst; geen extra zoek-API-kosten, nieuwe cron, sender, crawler of database. Alleen de expliciete `mailto:` van een identiek geïdentificeerde persoon, met volledige naam dichtbij het mailto-adres op een pagina waarop ook de bedrijfsnaam staat, en een adresdomein gelijk aan het officiële paginadomein, kan kandidaat zijn. Gratis privémail, generieke mailboxen, gegokte adressen, platform-/LinkedIn-scraping en redirects vallen af.

Alleen bestaande expliciet goedgekeurde relaties zonder huidig adres en zonder revoke/opt-out worden onderzocht. Een geldige bronvondst schrijft onder CAS in `bg_connecties.extra.public_work_email_candidate` met adres, oorspronkelijke person-/action-key, bron-URL, tijdstip, bronbewijs, confidence, onverifieerbare deliverability en `send_authorized=false`. **Nooit** direct naar `bg_connecties.email`; dat veld blijft nul zolang onafhankelijke adresverificatie en volledige rechtmatige kanaalbevoegdheid ontbreken. De oorspronkelijke `powerhouse_runtime_events` krijgt exact één idempotent event `contact_public_work_email_candidate` met zonder privé-adres geredigeerde bronreferentie en `CANDIDATE_INGEST_ACK_CONSUMER_PROCESSED_PENDING`. Zonder feitelijke verwerking door bestaande #138 identity-graph en originele ONE BRAIN/Heartbeat is er géén `PROCESSED`-ACK.

Dagelijkse metingen zijn afzonderlijk: (a) alle contacten in context, (b) bronpagina's bekeken, (c) expliciete werkadreskandidaten veilig geparkeerd, (d) door originele ontvanger werkelijk verwerkte kandidaten, (e) alleen na eigen verificatie naar verzendbare canonieke e-mail gepromoveerd, (f) oorspronkelijke provider-verzendingen + reply/order/learning. NULL/UNKNOWN blijft open met oorspronkelijke owner/fingerprint. Herhaal uitsluitend binnen de bestaande #116-lus; geen HTTP/scheduler-tweede kanaal, automatische outbound uit nieuwe kandidaten of betaalde vendor-fallback.

### Correctie uit daadwerkelijke productiedata — 14 november 2026

Readback: 23.295 connecties; 605 bestaande e-mails; 22.690 zonder e-mail; 123 reeds expliciet goedgekeurde relaties maar **nul** goedgekeurde relaties zonder e-mailadres. Daarom is de eerdere veronderstelling dat een bronagent een ontbrekend adres kan vinden via de consent-goedgekeurde groep een functionele nulroute. Voor **alleen publieke, niet-verzendbare onderzoeks-kandidaten** is voorafgaande toestemming tot e-mailverzending geen selectievoorwaarde. Deze blijft strikt noodzakelijk bij promotie/werkelijke commerciële verzending onder de bestaande rechtmatigheids-/opt-out- en providercontrole.

De originele research Edge ontvangt vanuit #116 dezelfde bounded bestaande SERP (geen extra DataForSEO-query) én een maximaal acht onderzoeksacties per dag begrensde first-party bronroute: reeds bekende zakelijke bedrijfsdomeinen uit contacten met een bestaand bedrijfsadres -> exact hetzelfde bedrijf en een connectie zonder e-mailadres -> hooguit twee publieke zakelijke URL-paden per kandidaat. Voor ieder onderzoek wordt een originele idempotente `powerhouse_sales_actions`-actie geregistreerd, onder oorspronkelijke person_key/bedrijf en dag, zonder verzending. Alleen onafhankelijk op de bedrijfsbron gevonden persoonsgebonden werk-`mailto:` wordt als `public_work_email_candidate` geparkeerd. Geen `bg_connecties.email`-write, geen provider-send, geen nieuwe scheduler. Een brononderzoek zonder geldig adres is een gedocumenteerd **NO_SOURCE**, niet een verzonnen adres. Tot aparte echte originele #138/ONE BRAIN `PROCESSED` readback blijft overdracht OPEN.

### Originele ontvanger #138: kandidaatverwerking is onafhankelijk van bron-INGEST

De oorspronkelijke `powerhouse-identity-graph-v1` (#138) roept in de bestaande `powerhouse_connection_daily_pulse_v1` het consumer-contract `powerhouse_ack_public_business_email_candidates_v1` aan. Voor iedere pending `contact_public_work_email_candidate` moeten de canonieke contact-`extra`, oorspronkelijke `powerhouse_sales_actions` (status `done`), person/company, originele action/correlation, source URL, revision en kandidaat-only/no-send markers door de ontvanger onafhankelijk overeenkomen. Alleen dan schrijft de ontvanger `IDENTITY_GRAPH_PROCESSED` en een exacte `COMMERCIAL_EXECUTION`-verplichting met `PROCESSED` in ONE BRAIN. Deze verplichting betekent uitsluitend **bron-kandidaat door identiteitssysteem verwerkt**; de overkoepelende commerciële keten blijft OPEN zolang afzonderlijke Heartbeat/NBA-outcome-proof ontbreekt. De actuele Powerhouse daily graph blijft de source snapshot alleen hergebruiken; adreskandidaten staan duurzaam onder de bestaande contact-`extra` en zijn nog niet verzendbaar. Zonder match: `held` + retries via origineel #138, nooit valse ACK.

### 14 november 2026 — originele publieke bedrijfswebsite valt door redirects weg: herstel en controle

De echte productie-loop #116 heeft acht originele eerste-domeinacties aangemaakt en heeft voor alle acht expliciet `public_email_source_status=NO_EXPLICIT_NAMED_OFFICIAL_MAILTO`, `public_email_source_checked=false` en `public_email_next_attempt_at` vastgelegd. Dit is een onderzoek zonder bruikbare openbare HTML en NIET acht gevonden werkadressen. BRAIN-verplichting `43c90754-3fd0-4c97-bb14-fbf815e12f47` blijft OPEN. De eerdere limiet van twee publieke pagina's is voor deze niet-betaalde first-party pass opgevolgd door **maximaal drie** (/team, /contact en homepage), en 2 veilige HTTPS-doorverwijzingen binnen hetzelfde werkelijke bedrijfsdomein (www-alias toegestaan), nooit cross-domain, HTTP downgrade, private host, login of onbegrensde content. Gebruik Amsterdamse kalenderdag voor het originele source-action dedupe; nooit UTC om een NL-dag te bepalen. Behoud bestaande max 8 original actions/dag en downstream producer/source-ACK versus echt consumer `PROCESSED`, send authority en commercial outcome afzonderlijk. Bij geen bron blijft concrete status, oorspronkelijke owner en volgende veilige herprobetijd zichtbaar; claim geen verrijking.
