# Onderzoek daadwerkelijk laten landen in commerciële e-mails — 9 november 2026

## Gebeurtenis
Het commerciële Powerhouse verwerkte relaties en draaide zijn bestaande dagelijkse en uurlijkse taken. Toch leverde de keten geen bewezen nieuwe e-mailverzending. Een persoonsgerichte e-mail had terecht een concrete openbare aanleiding nodig. Die aanleiding werd voor één actie inmiddels aantoonbaar gevonden en als goedgekeurd bedrijfsnieuws opgeslagen, maar bereikte de oorspronkelijke berichtmaker niet.

## Wat verandert
De originele `powerhouse-commercial-message-composer` haalt een afgerond onderzoek automatisch terug in dezelfde e-mailactie. Eerst matcht het de bron met de precieze persoon, organisatie en originele onderzoekstaak. Vervolgens controleert het of het bedrijfsnieuws door de bestaande bronlaag is goedgekeurd, voldoende betrouwbaar en recent is. Alleen dan wordt de tekst opnieuw samengesteld en door de bestaande kwaliteitscontrole gehaald. De tweede e-mail waarvoor nog geen echt bewijs bestaat, blijft terecht wachten.

## Wat onveranderd blijft
E-mails gaan pas weg na bestaande bevoegdheids-, toestemming-, uitschrijf-, druk- en duplicatiechecks. Succes vereist een providerbevestiging en onafhankelijke readback. Geen tweede executor, nieuwe scheduler, kunstmatig bronbewijs of onbeperkte mailcampagne. Externe signalen zijn mogelijke aanwijzingen, geen bewezen koopintentie.

## CRO/Growth en lerend vermogen
Voortgang wordt per fase bewezen: bruikbare connecties, geverifieerde aanleiding, kwaliteit goedgekeurd, verzonden, provider bevestigd, antwoord, afspraak, order, betaalde omzet. Een cron die slaagt is niet de commerciële KPI. Experimenteerresultaten worden pas bewezen beschouwd bij voldoende valide vergelijkbare uitkomsten, liefst met behandeling en controlegroep; zonder voldoende data blijft het oordeel **INSUFFICIENT_EVIDENCE**.

## Bewijs en status
Regression: `tests/brain-verified-research-composer-handoff-20261109.test.mjs`. Verplichte GitHub CI, CodeQL, merge en productie-readback zijn nodig vóór live-status. Er is geen nieuwe verzending of omzet aangetoond door deze broncodewijziging.
PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5543
