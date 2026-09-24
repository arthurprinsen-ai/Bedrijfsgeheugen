# Exact production artifact refresh — 24 september 2026

## Root cause
De laatste beschikbare Production Source Snapshot artifact liep achter op de nieuwste protected `main`, terwijl de normale Netlify-promotie door verlopen deploy-authorisatie was geblokkeerd.

## Fix
De bestaande Production Source Snapshot workflow krijgt uitsluitend een operationele refresh-marker zodat GitHub na protected merge opnieuw een exact artifact van de nieuwste `main` produceert. Er wordt geen applicatiegedrag gewijzigd.

## Preventie
Een recovery-deploy gebruikt nooit een oudere artifact als actuele main-bron zonder expliciete lineage. Als main sinds de laatste artifact is gewijzigd, wordt eerst een nieuwe canonical production-source artifact gemaakt.

## Terminal bewijs
Ook na deze artifact-refresh blijft `LIVE_BEWEZEN` afhankelijk van provider-success, exacte `release.json` SHA/context/deploy-id en productie-browserreadback.


## Post-pricing-parse-fix refresh
Na merge van de pricing build parsefix op `e223851136669000f1f58b6b1dadfe9e2f2adcc1` startte alleen Production Release Readback. Daarom wordt de canonieke Production Source Snapshot één keer operationeel gerefresht zodat de gecorrigeerde main-SHA daadwerkelijk naar Netlify kan worden gepromoveerd.


## Problem Radar executive P0 refresh
Na merge van PR #2779 op `53c1c5db7a6e499f3afa4a5d9b470e6196460579` stond Netlify productie nog op `be5ec08e69600acfdba31b28af0d6736c84917d6`. Daarom wordt uitsluitend de canonieke Production Source Snapshot opnieuw getriggerd. LIVE_BEWEZEN volgt pas na provider-ready + exacte productiecommit-readback.
