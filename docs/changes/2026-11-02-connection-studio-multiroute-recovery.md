# AI Koppeling Studio — multi-systeem, meerdere paginakeuzes en herstel (2026-11-02)

Obligation: `portal-connection-studio-multiroute-recovery-20261102-v1`  
Incident fingerprint: `portal|connection-studio|single-destination-and-sample-vs-ingestion-gap|20261102-v1`.

## Bronwaarneming
De bestaande wizard configureerde één bron met één doel en voorbeeldveldmappings. Afzonderlijke opgeslagen connectoren bestonden al in de originele `connector_definitions`-opslag, maar de studio liet niet meerdere concepten of meervoudige bestemmingspagina's zien. De huidige `datahub.safeTest` valideert alleen lokaal: geen persistente klantdata, geen echte operatorreadback en geen Powerhouse-ingest. Daardoor zou het onjuist zijn om omzet of klantgegevens op andere portaalpagina's als automatisch geïmporteerd te presenteren.

## Geïmplementeerd in bronkandidaat
- Bestaande AI-koppelwizard biedt afzonderlijke conceptopslag, overzicht van eerder opgeslagen verbindingen en een volgende koppeling starten.
- Meerdere geselecteerde gegevensvelden sturen de toegestane mapping aan; meerdere expliciet gekozen Portal V2-pagina's sturen de weergave van de connectorstatus aan.
- Beide keuzes staan per tenant/connector in de originele definitie. De server valideert veldnamen tegen het documentschema en pagina's tegen een vaste allowlist. Met `CONNECTION_ONLY` is alle portaalroutering verboden; `brain-verwerking` vereist `PORTAL_AI`.
- Per gekozen pagina verschijnt uitsluitend veilige connectorbronmetadata via de bestaande `/api/connectors/page-sources?page=` route. Geen ruwe inhoud, credentials, voorbeeldfacturen of ongeverifieerde financiële waarden.
- Gecontroleerde foutgids voor authenticatie, bevoegdheid, ontbrekende adapter, toestemming, EU-verwerkingslocatie en transportstoring. Eén automatische nieuwe `safeTest` bij werkelijk tijdelijke transportfouten; geen auto-retry van writes of privilege bypass.
- Wijziging van velden, pagina's of toestemming laat testbewijs vervallen. Bestaande concept-ID wordt behouden en opnieuw geversioneerd.

## Nog niet bewezen, dus nadrukkelijk geen liveclaim
Er bestaat in deze slice **geen** generieke productie-data-ingest van willekeurige klantsoftware naar een persistent, genormaliseerd klantrecord dat automatisch KPI-gegevens, Brain of Powerhouse vult. Om dat te leveren moet de oorspronkelijke connector/datahub-eigenaar per provider een echte, gescopeerde bronread, idempotente afgeschermde opslag, lineage, RLS, retentie, herroepbaarheid en verse source-to-target readback bouwen. Relevante portaalpagina's mogen daarna alleen geregistreerde, gevalideerde en geautoriseerde meetwaarden gebruiken.

Acceptatie van dat vervolg: echt toegestaan testbedrijf, synthetische testrecords in echte OAuth-provider, onafhankelijke readback bron→EU-opslag→applicatiestroom→relevante pagina→Brain/Powerhouse-opt-in; revocation/purge; geen false-green, minimaal twee tenanttests en 320/390/768px + toetsenbord/assisterende technologie. Regio en modelgebruik afzonderlijk bewijzen. 'Het lukt altijd' is niet verantwoord te garanderen voor software die geen API, rechten of passende dataresidentie heeft.

## Borging
Root cause: éénmalige wizard zonder bestemmingsroutering, samen met de verleiding om een synthetische `TEST_PASSED` te verwarren met echte klantgegevens. Eigenaar: originele Portal V2/connector/ONE BRAIN. Preventie: `tests/brain-connection-studio-multipage-recovery-20261102.test.mjs`, bestaande API en source-evidence testen, bestaande release/CodeQL/BRAIN, System Map en Netlify exacte SHA plus authenticated browser readback. Geen tweede executor, ingeststore, modelroute of direct productie-deploy. Volledige inhoudsdoorvoer blijft `EVIDENCE_DUE`.
