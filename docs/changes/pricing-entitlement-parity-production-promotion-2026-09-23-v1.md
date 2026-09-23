# Pricing entitlement parity production promotion — 2026-09-23

## Doel
Een nieuwe, aantoonbare productie-deploy uitvoeren nadat de entitlement-parity gate als niet-deployment wijziging op main was gemerged.

## Uitvoering
`prijzen.html` bevat een inert promotion marker. Daardoor loopt deze wijziging door de bestaande website release lane naar Netlify.

## Live-criterium
Alleen LIVE wanneer:
- de PR-gates groen zijn;
- exact deze candidate naar main is gemerged;
- de productiecontroller dezelfde main-SHA als gedeployd waarneemt;
- `/prijzen` publiek 200 teruggeeft zonder browser-/assetfouten.
