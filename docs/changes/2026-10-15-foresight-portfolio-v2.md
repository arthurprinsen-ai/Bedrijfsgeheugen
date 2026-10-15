# Powerhouse Foresight — bedrijfsbrede scenariovergelijking (v2)

Refs: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4420
Obligation: powerhouse-foresight-portfolio-4420-v2

## Bestaand en nieuw
Behoud Portal V2, de bestaande 7-domeinen trendengine, het tenantgebonden Powerhouse signaal-overlay, de scenariokeuzes, context links en de Brein runtime bridge. Voeg geen nieuwe data-autoriteit, cron of gateway toe.

Nieuw is een vergelijking over alle zeven domeinen in een interactieve, scrollbare tabel met per domein een onafhankelijke tegenvaller, basisprojectie en meewind op dezelfde horizon en peildatum. Klik op een rij om hetzelfde doel in de bestaande grafiek te openen. Toon ook expliciet wat ontbreekt aan historie/versheid en link naar bedrijfssituatie.

## Waarheidsgrenzen
Een gelijke gevoeligheid (bijv. +/- 10%) op omzetgroei, marge, cash runway, risico, handmatig werk, exitgereedheid en waarde is uitsluitend een rekenkundig scenario voor elk afzonderlijk doel. Het is geen gekoppeld causaleconomisch model; gemengde eenheden worden niet opgeteld. Down-goals (restrisico en handmatig werk) gebruiken de juiste richting.

Een afzonderlijk operationele Brein sectie gebruikt alleen de recent aantoonbaar ingelezen `portal.runtime.observability` uit het bestaande geauthenticeerde Brain-operating-loop. Ontbreekt de opname, is ze ouder dan 24 uur of komt ze uit een onbekende bron, dan blijft de status onbekend. Geen Heartbeat SLA, historische beschikbaarheid, voorspelde storingen of platformbrede data worden verzonnen.

## Bronbeschikbaarheid ten tijde van ontwikkeling
Read-only Supabase-audit op 2026-10-15: portal_financial_forecasts_v1 0 records/0 verified, portal_state_layers 1 legacy record/0 canonical-brain, tenantgefilterde impact records 3, platformbrede forecasts 6142. Deze platformdata is geen toegestane klantprognose zonder identiteit en onafhankelijk bewijs.

## Release
Betrokken code: portal-v2/foresight-portfolio.js, portal-v2/foresight-scenario-studio.js, portal-v2/foresight-scenario-studio.css en tests. Eerst learning admission, Required CI, CodeQL, protection, Netlify exact-sha deploy en live geauthenticeerde readback. Geen claim dat volledige integratie met Heartbeat/prognosekalibratie af is.
