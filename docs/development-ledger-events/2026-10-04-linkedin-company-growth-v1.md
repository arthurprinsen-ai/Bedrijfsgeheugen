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
`tests/brain-linkedin-company-growth-engine-v1.test.mjs` bewaakt organisatie-identiteit, baseline, targets, single-scheduler, kanaalscheiding en vanity-metric truth boundary.


## Terminale production proof
Protected PR #3674 is gemerged naar `main` commit `6d9770aad32289d000f209d9ea54c72ed5511b73`. De migratie is toegepast op de canonieke Supabase-productieomgeving en `public.powerhouse_refresh_linkedin_company_growth_v1('2026-10-04')` is teruggelezen met status **GROW**, diagnose **critical_distribution_gap**, 12 page views tegenover target 300, 12 company posts, 31 observed impressions, 21 observed reach en 3 idempotente growth-aanbevelingen. Cron-readback toont uitsluitend de bestaande commerciële scheduler: job 116, `27 * * * *`, `select public.powerhouse_trigger_based_mkb_acquisition_cycle_v1();`. Notion System Map, Menselijk Handboek en Master Register zijn bijgewerkt en teruggelezen. Persoonlijk LinkedIn blijft commercieel uitgesloten.
