# Incident — V18 testomgeving verloor zijn identiteit

Datum: 2026-08-30
Status: RECOVERY + PREVENTION

## Wat ging mis

De begrippen `geaccepteerde V18-bron`, `engineering deploy preview` en `productie` werden niet hard genoeg van elkaar gescheiden. Daardoor konden twee fouten ontstaan:

1. Netlify deploy previews gebruikten eerder dezelfde productiecomposer als live, waardoor een technisch geslaagde preview visueel weer productie kon tonen.
2. Een mutable `deploy-preview-*` alias werd als gebruikers-testlink behandeld. Een groene deploystatus bewees daarmee niet dat precies de bedoelde, publiek bereikbare V18-versie via de gedeelde URL beschikbaar was.

## Root cause

De keten valideerde vooral build/deploy-succes en routes, maar niet de **identiteit van de testversie**. Er ontbrak een machine-readable, immutable bron van waarheid voor de door de gebruiker geaccepteerde V18-versie.

## Herstel

- De geaccepteerde V18 is vastgepind in `site/v18-test-source.json`.
- Broncommit: `195d30e411a327553f81be40815d4c0d8da4e98d`.
- Brondeploy: `6a918685f3737c0008ee981a`.
- Gebruikers-testlink is een immutable deploy-permalink, nooit een `deploy-preview-*` alias.
- Deploy previews mogen de productiecomposer niet gebruiken.
- V18 CI controleert de pinned bron, de dedicated previewcomposer en de publieke bereikbaarheid plus V18-markers.

## Permanente regels

1. V18 is leidend waar een geaccepteerde V18-pagina bestaat.
2. Als V18 alleen linkt naar een bestaande productiepagina, blijft de productiepagina behouden totdat er een expliciet geaccepteerde V18-vervanger is.
3. Ontbrekende zichtbare V18-links krijgen een echte pagina; geen dode links.
4. Productieblog blijft behouden.
5. Nooit een mutable preview-alias als officiële testlink delen.
6. `ready` of groene CI is niet genoeg: de exacte publieke gebruikers-URL moet bereikbaar zijn en de verwachte V18-identiteitsmarkers bevatten.
7. Geen productiepromotie zonder expliciete visuele/business-goedkeuring.

## Preventie

Een regressietest blokkeert stille drift van commit, deploy-ID, test-URL of previewcomposer. De workflow verifieert daarnaast de publieke pinned URL. Als dit rood wordt, is de V18-testidentiteit niet betrouwbaar en mag er geen nieuwe testlink als geldig worden gemeld.
