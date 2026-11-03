# LinkedIn persoonlijk en Instagram/Mira — preventie van terugkerende publicatiefouten

Status op 2026-10-29: **DEGRADED / NOT_ALL_GREEN**. Dit document is een broncodewijziging, geen bewijs dat vandaag een nieuwe post live is.

## Wat ging mis?

1. **LinkedIn persoonlijk.** Vijf herstelpogingen voor 29 oktober eindigden op `GLOBAL_POST_DUPLICATE_BLOCKED:STORY_FAMILY_DUPLICATE`. De oorspronkelijke post van 24 oktober valt terecht onder duplicate-preventie. De canonieke bronselectie heeft 80 eligible signals maar 0 die alle frisse, publicatiedatum-, menselijke-context-, score- en content-gates doorstaan. De reeds gemergede PR's #5086 en #5090 leggen datum/sourcerotatie vast; ongeschikt/oud bewijs mag nooit worden gepresenteerd als een nieuw persoonlijk verhaal. Geen publicatie of provider-ID voor 29 oktober.
2. **Instagram/Mira.** Het originele OpenArt-videokandidaat had startframe-identiteitsvertrouwen 0.900 (< verplicht 0.940). Deze bytes mogen nooit naar Meta. PR #5132 beschermt de bestaande router tegen afkeuring-uitwissing bij preflight. Productie-DB-functie `powerhouse_ensure_instagram_media_job_v1(date)` bleef echter een losse herinitialisatie doen: `ON CONFLICT` overschreef het bestaande `asset_manifest` in `WAITING_ASSET` wanneer `asset_url` of `openart_resource_id` ontbrak, zelfs wanneer `openart_history_id` al was geclaimd. Herhaalde Heartbeat-runs konden daarmee het bewijs vernietigen.
3. **Meetlus.** Cronjob 140 draait uurlijks, maar succesvolle SQL-runs betekenen niet dat de publicatie live staat. Het bestaande social-recovery agent-team is een taakrouter, geen bewezen autonome post of media-generator; provider-ID en readback blijven beslissend.

## Structurele fix in dezelfde autoriteit

De originele ensure-functie krijgt een fail-closed conflictguard: alleen een nog **onbezet en leeg** QUEUED/WAITING_ASSET/WAITING_PROVIDER_CONNECTION-slot met `attempts=0`, zonder error, mediahistory, bewijsmanifest of republishverbod mag worden aangepast. Bij alle andere statussen hergebruikt de functie via readback exact dezelfde bestaande job-ID zonder bestaande providerhistorie, afkeuring of attempts aan te raken. Een werkelijk nieuw goedgekeurd bestand loopt daarna uitsluitend via de oorspronkelijke Mira-router en de originele Meta-publisher.

Geen nieuwe scheduler, extra database, duplicaatreset, kostenverhoging, toegangsverruiming of Identity Threshold verlaging. LinkedIn vereist een aantoonbaar nieuwe bron/familie en pas daarna originele publisher. Werkelijke OAuth-consent wordt niet omzeild. De veiligheidsinvarianten van issue #4439 blijven van kracht.

## Acceptatie en portal-truth

- SQL-functie op exact beschermd `main` via migrations en Required/BRAIN/CodeQL, daarna `pg_get_functiondef` bevestiging in productie.
- Tweemaal dezelfde oorspronkelijke Instagram-ensure + router-preflight doorlopen: **zelfde job-ID, history-ID, rejection, attempts en timestamps**; geen nieuwe betaalde OpenArt-check en geen Meta-post op afgekeurde bytes.
- LinkedIn persoonlijk: nieuwe datum/bron, originele duplicate-gate, unieke provider-ID en onafhankelijke readback voor lokale dag.
- Instagram: nieuwe werkelijk gecontroleerde Mira-media (start/midden/eind >=0.940, beweging >=0.900), originele publisher-ID en Meta-readback.
- Portaal/Brain toont per kanaal OPEN, BLOCKED en LIVE_PROVEN als afzonderlijke uitkomsten; oude `PLANNED` of cron-succes is nooit groen.
- Een 7-daagse reeks zonder verlies van mediahistorie/zichtbaarheidsbewijs is nodig voordat structurele regressiepreventie `PROVEN` heet.

Private incidents en broninhoud blijven in het bestaande ONE BRAIN. Dit openbare document bevat geen privé-drafts, tokens of klantdata.
