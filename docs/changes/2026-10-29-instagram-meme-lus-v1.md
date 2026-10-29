# Instagram meme-lus v1 (29 okt 2026)

Status: draft. Alleen config, documentatie en sluitingsbundel. Geen code die runtime raakt, geen migratie, geen uitrol, geen credits uitgegeven.

## Koppeling sluitingsbundel

- Obligation-ID: growth:instagram-meme-lus-v1:20261029-v1
- Leerbestand: brain/learning/2026-10-29-instagram-meme-lus-v1.json
- Fingerprint: instagram-meme-lus-v1-config-only
- Ledger-event: docs/development-ledger-events/2026-10-29-instagram-meme-lus-v1.md
- Configtest: tests/brain-instagram-meme-lus-config-v1.test.mjs

## Besluit

Arthur gaf op 29 okt 2026 akkoord op het ontwerp in Notion-pagina 35 (Mira Meme Engine): een Instagram-leermodel binnen het bestaande orchestrator-pad, als uitbreiding van de LinkedIn-lus (draft-PR 5056). Geen tweede scheduler, geen Make, geen Buffer-publicatie.

## Wat deze PR vastlegt

- config/instagram-meme-lus-v1.json: dagplafond 400 credits, een kandidaat per mislukking, gezichtspoort 0,94 op drie frames (niet versoepeld), beloningsvolgorde, waarheidsniveaus, een variabele per post, fase A en B, beslisregels.
- Dit document, het leerbestand, het ledger-event en de configtest.

## Wat deze PR niet doet

- Het plafond wordt nog niet door code afgedwongen. Zolang dat ontbreekt is het een afspraak, geen poort.
- Geen wijziging aan de producer, de gezichtspoort of de publicatie.
- Geen koppeling van Windsor aan Instagram (wacht op besluit Arthur).
- De canary in het leerbestand is een configcontrole, geen live canary.

## Open voorwaarden voor uitvoering

1. PR 4270 (een identiek Mira-gezicht over alle frames) landen.
2. Meting uitbreiden: ig_reels_avg_watch_time, reels_skip_rate, shares, saved, profile_activity per post; accountniveau profile_views en follows_and_unfollows.
3. Dagplafond in code afdwingen vóór elke OpenArt-aanroep.
4. Akkoord Arthur op samenvoeging met het LinkedIn-spoor (5056).

## Bewijs

Gemeten op 28 okt in Supabase: laatste echte Instagram-post 3 okt; 13 posts sinds 14 sept met 0 shares en 0 saves; powerhouse_instagram_media_jobs_v1 op WAITING_ASSET of WAITING_PROOF; instagram_growth_research_sources laatst ververst 12 sept.

## Bron

Notion-pagina 35 Mira Meme Engine, het Instagram-leermodel (https://app.notion.com/p/407da36aac8a8137ad04dedccec43312).
