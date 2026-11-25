# Mira-radar: korte nieuwsqueries en 45-dagenvenster

Datum: 27 oktober 2026. Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Bestaande oorzaak
Productierun 14302: 6 van 7 lange queries gaven DataForSEO-taak 40101 (Google-side, geen resultaten). Directe tests tonen dat korte queries wel 7-10 nieuwsitems geven, maar Google News rangschikt op relevantie, niet op versheid.

## In-place herstel
Korte queries, venster 45 dagen (binnen de 60-dagengate, die de enige autoriteit blijft), 40101 geteld als `dataforseo_no_results` zonder retry.

## Nog niet claimen
Geen winnaar tot een run gedateerde, themagebonden signalen opslaat.
