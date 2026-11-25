# GA4 Data Spine — verschil tussen storing en toestemming

## Productiereden
PR #5400 is op 4 november beschermd gemerged, originele Supabase Edge v15 actief en native `bg_roep_functie` request #20617 verwerkt. Onafhankelijke Google totalen waren voor 3 november 0 sessies/0 events, en originele privacyvriendelijke eerste-partijmeetbron had 0 sessies mét toestemming. De originele collector schrijft correct `privacy_limited`, `source_data_available=false` en een duurzaam ONE BRAIN-gebeurtenisbewijs.

De **Data Spine** projecteerde nog steeds `RECOVERY_DUE/STALE` alsof de Google-koppeling kapot was. Dit komt uit de oude `powerhouse_data_spine_health_v1` die uitsluitend de datum van de laatste niet-lege GA4-providerwaarneming bekijkt, zonder de nieuwe onafhankelijke consentbeperking te classificeren.

## Correctie zonder schijn-groen
Een originele `CREATE OR REPLACE VIEW` behoudt **alle tien bestaande producenten en hetzelfde schema**, `ga4-analytics.producer_required=true` en de echte `STALE`-bronversheid. Alleen het operationele oordeel mag `CONSENT_LIMITED` zijn wanneer de **nieuwste** native GA4-sync recent (maximaal acht uur) expliciet `privacy_limited` meldt en de bijbehorende originele runtime-receipt onafhankelijk nul geautoriseerde first-party events en nul Google-totalen bewijst. Bij ontbrekend, afwijkend of ouder bewijs blijft het oorspronkelijke `RECOVERY_DUE` (of `PRODUCER_OR_INGEST_GAP`). Er worden geen sessies, toestemmingen of echte bronwaarnemingen aangemaakt.

Beveiliging: originele view slechts voor `service_role`; `public/anon/authenticated` geen leesrecht. Geen tweede scheduler, Queue, Brain of provider. Deze classificatie is geen verklaring dat er geen verkeer was, alleen dat er **geen toegestane GA4-meting** beschikbaar is.

## Terminal check
Beschermde PR-merge en originele testcheck, migratie in native productie-ledger, onafhankelijke data-spine `CONSENT_LIMITED/STALE` tijdens geldige v15-receipt, volgende natuurlijke #42 en 8-uurs vervaltest, behoud oorspronkelijke automatische ONE BRAIN-herstelverplichting. Tot die tijd `NOT_LIVE_PROVEN`.
