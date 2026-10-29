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
