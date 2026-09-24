# Exact production artifact refresh — 24 september 2026

## Root cause
De laatste beschikbare Production Source Snapshot artifact liep achter op de nieuwste protected `main`, terwijl de normale Netlify-promotie door verlopen deploy-authorisatie was geblokkeerd.

## Fix
De bestaande Production Source Snapshot workflow krijgt uitsluitend een operationele refresh-marker zodat GitHub na protected merge opnieuw een exact artifact van de nieuwste `main` produceert. Er wordt geen applicatiegedrag gewijzigd.

## Preventie
Een recovery-deploy gebruikt nooit een oudere artifact als actuele main-bron zonder expliciete lineage. Als main sinds de laatste artifact is gewijzigd, wordt eerst een nieuwe canonical production-source artifact gemaakt.

## Terminal bewijs
Ook na deze artifact-refresh blijft `LIVE_BEWEZEN` afhankelijk van provider-success, exacte `release.json` SHA/context/deploy-id en productie-browserreadback.
