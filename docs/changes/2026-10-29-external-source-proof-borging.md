# Externe signalen: herstelbewijs en blijvende agentafspraken — 29 oktober 2026

## Wat was er mis?
De bestaande bronverwerking kon na Tavily-abonnementslimiet 432 een DataForSEO-fout 40101 krijgen. De batch van 15:54 Nederlandse tijd verwerkte twee van drie onderwerpen. Bij Bedrijfsoverdracht mislukte de provideropdracht. De oude herhaalregel kon onnodige extra kosten veroorzaken; 40101 is geen bevestigde lege zoekopdracht.

## Wat werkt nu aantoonbaar?
Beschermd gemergede code (#5127, #5129 en #5130) is actief als Supabase Edge `bg-externe-signalen` versie 24. Een eenmalige geautoriseerde controle via de **bestaande** Powerhouse-aanroeproute (request 15935) verwerkte 3/3 nieuwe onderwerpen succesvol: Concurrentie, Cyberdreigingen, Demografie. DataForSEO leverde 27 gevonden resultaten op, waarvan 5 door het bestaande filter kwamen. HTTP 200 en onafhankelijke ONE BRAIN-registraties zijn teruggelezen.

## Wat wordt permanent geborgd?
De bestaande Source Universe-agentskill onthoudt dat een handmatig geslaagde batch geen bewijs is voor de volgende automatische run. Het bijgewerkte Brain-leerrecord, ontwikkellog en de regressietest houden dat onderscheid vast. Fout 40101 wordt niet direct opnieuw betaald/verzonden; gedeeltelijke 207-runs blijven zichtbaar als mislukt. De historische Bedrijfsoverdracht-fout wordt niet overschreven.

## Wat staat nog open?
De reguliere mux-scheduler (job 171) draait op 30 oktober 2026 om 06:31, 06:51 en 07:11 Nederlandse tijd. De volgende natuurlijke run en het eerdere onderwerp Bedrijfsoverdracht moeten elk onafhankelijk bevestigd worden. Kostenbesparing, klantimpact en omzet zijn niet bewezen. Geen tweede scheduler of parallelle writer is toegevoegd.

## Bewijs en eigenaar
- Canoniek incident: `powerhouse|external-search|tavily-plan-limit-432|20261029`, ONE BRAIN registry VALIDATED versie 4.
- Gebeurtenislog: `external-intelligence:operator-postrelease-15935:v24`.
- Productiebewijs: request 15935; source observation 2026-10-29T15:12:54.378Z; Brain delivery GREEN voor deze batch.
- Herstel: GitHub #5130. Skill- en borgingswijziging: GitHub #5133. Overkoepelend incident: #4215.

## Cross-agent doorwerking en releasecontrole — 29 oktober 2026

De beschermde, volledige release van PR #5133 is bevestigd op `main` als commit `14ced18b5876fadc4e111d42f6bbac7cdb293b5a`. Required, de drie verplichte GitHub-checks en CodeQL zijn voor dezelfde bijgewerkte PR-head geslaagd. De canonieke Source Universe-agentskill, het Brain-leerrecord en de regressie werden daadwerkelijk van `main` teruggelezen. De Supabase-functie `bg-externe-signalen` stond bij de laatste onafhankelijke productiecontrole ACTIVE op v26 met een veilige 40101-no-retry-regel; dit is **een aparte productieobservatie** en mag niet als door PR #5133 uitgevoerde Edge-uitrol worden gerapporteerd.

De aanvullende borging maakt `AGENTS.md` tot expliciete router naar de reeds bestaande Source Universe-skill, het Brain-incident en de actuele providerwaarheid. Een bestaande test controleert deze router en de gescheiden bewijsstatussen. De bestaande Powerhouse-release-log bevat event `50695b94-9c3f-49ef-b53a-c66805d23307` met dedupe `github-protected-pr-5133-main-14ced18b5876fadc4e111d42f6bbac7cdb293b5a`. Het oorspronkelijke 2/3-incident blijft bewaard: natuurlijke scheduler-run, Bedrijfsoverdracht-topic, echte besparing, klantwaarde en omzet zijn **niet** bewezen. Geen tweede cron, executor, datastore, provideraccount of publisher.
