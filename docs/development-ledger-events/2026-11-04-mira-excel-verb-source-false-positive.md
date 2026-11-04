# 4 november 2026 — Mira-bronclassificatie: `Excel at` is geen spreadsheet

## Onafhankelijk vastgesteld
De oorspronkelijke Instagram-kansenradar selecteerde voor 4 november aanbeveling `d7206d60-f667-4859-b01e-4428fe1e831a`, onderwerp `excel-chaos` (PH-P006), gebaseerd op `Drawing Statewide Recognition: CHS and CHS9 Artists Excel at VASE Competition | MOCKINGBIRD ELEMENTARY` bij een Amerikaanse school. De term **excel at** betekent *uitblinken in*, niet het spreadsheetprogramma Excel. De originele classifier gebruikt echter `/excel|spreadsheet|.../` voor zowel onderwerp als ondernemerstrefwoord. Door de dubbele trefwoordmatch kon de kunstwedstrijd met score 0,737 als Nederlandse operationele spreadsheetproblematiek doorgaan.

## Oorspronkelijke correctie
De bestaande `powerhouse-mira-problem-radar` gebruikt voortaan `isSpreadsheetBusinessContext` uit `_shared/mira-business-spreadsheet-context.mjs`. Daarin telt Excel alleen mee met een expliciet spreadsheetbestand, product, werkmap, bedrijfsbewerking of Nederlands/Engels voorzetsel voor werk in/met/uit Excel. De uitdrukking `artists excel at` telt niet mee. Alle bestaande probleemonderwerpen, de 0,72 bronacceptatievloer, leeftijdsgrens, één dagelijks gekozen onderwerp en andere veiligheidsgates blijven behouden.

## Grenzen en preventie
Dit is geen toestemming om de **bevroren winnaar van 4 november** direct in productie om te zetten naar een ander onderwerp. Oorspronkelijke mediajob staat `WAITING_ASSET`; er is geen definitief onafhankelijk Mira-videobewijs of Meta-provider-ID. Geen dure OpenArt-generatie voor de kunstwedstrijd, geen misleidende post en geen fake groen. De oorspronkelijke canonieke bronselectie-agent moet binnen dezelfde lineage een ánder werkelijk relevant en vers geverifieerd ondernemersprobleem leveren; zijn bewijs- en autorisatievoorwaarden blijven leidend.

## Validatie
Deterministische regressie `tests/brain-mira-excel-verb-source-quality-20261104.test.mjs`, leerregel `brain/learning/2026-11-04-mira-excel-verb-false-positive-v1.json` met historische replay, shadow en canary, bijgewerkte bestaande agent-skill. Alleen protected Required/BRAIN/CodeQL/Supabase Preview, merge en echte originele Edge source parity maken deze classifierfix live. Pas definitieve OpenArt MP4 met echte face score >=0,940 in start/midden/eind, Meta provider-ID/URL en onafhankelijke readback maakt het Instagramkanaal groen.

Incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Ontwikkelregistratie
- Geobserveerd 2026-11-04 06:50 UTC, originele aanbeveling PH-P006.
- Bronfout: semantische homoniem Excel (software) versus excel (Engels werkwoord).
- Onderzochte oorspronkelijke OpenArt-projectbibliotheek heeft geen nieuwe video op 4 november; oude 3 november video afgekeurd wegens start-face 0,900.
- Dit wijzigingspakket draait niet zelf de provider en creëert geen kosten.
- Eigenaar: originele Mira-radar bronclassificeerder, behoud bestaande mediajob en identiteitspoort.
