# Commerciële composer: OpenAI json_object vereist het woord JSON in de input

Datum: 27 oktober 2026. Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Bestaande oorzaak
De OpenAI Responses-aanroep gebruikt `text.format: json_object`, maar de input bevatte het woord "JSON" niet. OpenAI antwoordt dan met 400 en de composer kan geen outreach-bericht opstellen.

## In-place herstel
De inputtekst begint nu met "Antwoord uitsluitend als JSON-object." Geen nieuwe route, scheduler of provider.

## Nog niet claimen
Geen verzonden mails tot een run een bericht heeft opgesteld én de bestaande verzendpoort is gepasseerd.
