# P0 #4198 — legacy Buffer-verzamelplanning uitzetten, canonieke social keten behouden

Bron: [GitHub #4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198)

## Productiebron
Netlify-observability van 20 oktober 2026 toont geplande aanroepen van `/.netlify/functions/buffer-social-collect` die HTTP 503 retourneren omdat de oude Buffer-provider `BUFFER_HTTP_401` teruggeeft, onder andere om 12:15:31, 12:15:38 en 12:15:55 UTC. Buffer is niet de geautoriseerde social-executor in Powerhouse.

## Afgebakend herstel
Verwijder uitsluitend de Netlify `config.schedule` van `buffer-social-collect.mjs`. De bestaande handler blijft voor expliciet historische diagnose beschikbaar, maar wordt niet automatisch meer aangeroepen. Geen wijziging aan de dagelijkse social-executor, LinkedIn / Instagram, CRM, contactbeoordeling, de reguliere provider-native metricsverzameling, Notion, GitHub cron of commerciële Heartbeat. Er komt geen Buffer fallback en geen tweede executor.

## Acceptatie
Required/CodeQL en Netlify preview; beschermd mergen; exact productie-deploy en bevestigen dat nieuwe automatische Buffer-uitvoeringen niet meer worden gepland. Controleer daarna alsnog afzonderlijk de provider-native sociale acties en providerbewijzen. Zonder deze readback en de overige P0-evidentie geen platformbrede GREEN-status.
