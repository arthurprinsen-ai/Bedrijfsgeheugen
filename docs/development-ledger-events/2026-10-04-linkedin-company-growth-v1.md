# 2026-10-04 — LinkedIn company-page growth closed loop v1

Fingerprint: `powerhouse-linkedin-company-growth-v1`

## Aanleiding
De LinkedIn-adminweergave van Bedrijfsgeheugen liet 12 paginaweergaven zien in de getoonde periode: 10 desktop en 2 mobiel. Dat is een distribution gap, niet alleen een contentprobleem.

## Root cause
Powerhouse had al company-publicatie, postmetingen, Growth Swarm, source-backed content, provider-readback en revenue learning. Er ontbrak één expliciete bedrijfspagina-growth loop die page/follower metrics omzet in bounded dagelijkse contentacties en diezelfde acties weer terugkoppelt aan owned-site en omzetuitkomsten.

## Oplossing
- canonieke policy met organisatie `urn:li:organization:18234216`;
- baseline 12/10/2 als geobserveerde pagina-analytics;
- eerste 30-dagendoel 300 page views en 100 relevante nieuwe volgers;
- dagelijkse aggregatie van bestaande `social_posts` + laatste OBSERVED `social_metric_snapshots`;
- maximaal drie growth-aanbevelingen: value asset, distribution loop en page conversion;
- integratie in de bestaande `powerhouse_trigger_based_mkb_acquisition_cycle_v1`, dus geen extra cron/scheduler;
- persoonlijke LinkedIn-identiteit blijft buiten deze commerciële bedrijfspagina-growth loop;
- revenue blijft terminale north star; views/followers zijn tussenmetingen.

## Preventie
Een LinkedIn-bedrijfspagina is niet groen omdat er een post live staat. Groen vereist een meetbare distribution loop en outcome learning. Nieuwe growthlogica moet dezelfde scheduler, content-recommendation authority, dedupe, source, identity en provider-readback gates hergebruiken.

## Regressie
`tests/linkedin-company-growth-engine-v1.test.mjs` bewaakt organisatie-identiteit, baseline, targets, single-scheduler, kanaalscheiding en vanity-metric truth boundary.
