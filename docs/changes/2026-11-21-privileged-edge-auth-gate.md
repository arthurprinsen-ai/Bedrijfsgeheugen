# 21 november 2026 — beveiligde serverdiagnostiek en operationeel overzicht

## Waarom
Twee bestaande Bedrijfsgeheugen-functies hadden wel verhoogde serverrechten, maar controleerden de aanroeper niet. Hierdoor kon een bezoeker zonder inlogstatus intern overzicht opvragen of onnodig databaseverbindingen opzetten. Er is **geen bewezen hack of gegevensdiefstal** vastgesteld.

## Wat is aangepast
- `bg-master-control` en `db-pooler-introspect-v1` accepteren uitsluitend een POST met een geldige, **server-only** credential. Publieke sleutels, gewone gebruikerssessies, onvolledige sleutels en tokens in de querystring worden afgewezen.
- De controle vindt vóór het openen van de databaseverbinding plaats. Interne foutmeldingen worden niet meer naar externe bezoekers gestuurd. Reacties zijn niet cachebaar en hebben bescherming tegen MIME-sniffing.
- De oorspronkelijke functionaliteit blijft beschikbaar voor geautoriseerde interne servicecalls; een productiesmoke met een echte bevoegde caller is nog een afzonderlijke taak.
- De **bestaande** Security Operations-monitor krijgt twee extra, niet-invasieve controles. Er ontstaat geen tweede agent, publicatie-executor of Make-route.

## Onafhankelijke verificatie
- Supabase ACTIVE `bg-master-control` v10 en `db-pooler-introspect-v1` v15; providerbron komt exact overeen met de beveiligde GitHub-bestanden.
- Echte externe verzoeken zonder toegangsgegevens leverden op beide endpoints GET HTTP 405 en POST HTTP 401. De foutreacties hebben `no-store` en `nosniff`.
- Elf regressietests geslaagd, inclusief afwijzing van publieke sleutels, gesimuleerde correcte servercalls en de voorrang van autorisatie boven databasegebruik.
- De bestaande security-run voor beide websites en beide endpoints: 6/6 controles geslaagd.

## Afbakening
Deze wijzigingen repareren twee specifieke gaten; ze zijn geen garantie tegen alle aanvallen. De bronrepository is nog publiek, een eerder ingestelde externe cron-token-gateway moet gefaseerd worden overgezet, en de privacy-/login-keuze voor het openbare PW-teamportaal is nog niet gemaakt. De vaste beveiligingscontrole wordt pas onderdeel van productie op de standaard GitHub-branch wanneer de beschermde PR met groen Required/CodeQL is samengevoegd.

Incident en technische verificatie: `docs/development-ledger-events/2026-11-21-unauthenticated-sensitive-edge-endpoints.md`.
