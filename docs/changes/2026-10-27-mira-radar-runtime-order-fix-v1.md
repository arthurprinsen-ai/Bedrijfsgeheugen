# Mira-radar: declaratievolgorde hersteld vóór uitrol

Datum: 27 oktober 2026. Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Bestaande oorzaak
PR #4997 gebruikte `title` en `excerpt` in de onderwerpbepaling vóór ze werden gedeclareerd. Elke run zou met een `ReferenceError` stoppen. De bundelcontrole en de patroontests zagen dat niet; het bleek bij een echte uitvoering met gemockte providers voordat er iets naar productie ging.

## In-place herstel
Twee regels verplaatst in de bestaande radar, plus een test op de declaratievolgorde. De functie is eenmaal uitgevoerd tegen gemockte providers en database: status 200, 1 signaal opgeslagen en eligible.

## Nog niet claimen
Productie draait nog de oude radar (v439). Geen winnaar of publicatie tot de uitrol en de eerstvolgende run zijn teruggelezen.
