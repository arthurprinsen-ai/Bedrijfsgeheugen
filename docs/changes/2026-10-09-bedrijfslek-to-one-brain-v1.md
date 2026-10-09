# Bedrijfslek → ONE BRAIN → POWERHOUSE → Heartbeat — 9 oktober 2026

## Bestaande staat en gevonden kloof
De gratis twaalfvragenzelfscan op /zelfscan toont direct score, domeinprofiel, drie verbeteracties, Mini-voortgang en teamuitdaging. Alleen deze flow leverde nog geen anonieme nulmeting via de **bestaande** Powerhouse scan-ingest; de workshopscan /scan en /frisse-blik deden dat wel.

## Herstel binnen bestaande architectuur
- /zelfscan verstuurt NA het direct tonen van de volledige uitslag precies één idempotente score/dimensie-payload naar de bestaande /api/powerhouse-scan-ingest.
- Het bestaande Netlify-proxyprotocol, het bestaande Supabase Edge endpoint, `scan_inzendingen`, `powerhouse_runtime_events` en `growth_events` blijven de enige schakelpunten.
- `source_kind=bedrijfslek_scan`, `kind=bedrijfslek_scan`, `source=website.bedrijfslek` en `intent=bedrijfslek` maken attributie en analayse mogelijk zonder parallelle registratie.
- Geen naam, mailadres, telefoon, raw antwoorden of aan bezoekers toegeschreven bedrijfsidentiteit in de payload. `tenant_identity_status=unverified` en `learning_scope=aggregate_only` blijven gelden.
- De ingelogde tenant kan een passende scan via het bestaande privileged `/api/portal-scans` claimen; de publieke scan heeft **nooit** toegang tot `history` of `claim`.
- De bezoeker krijgt alleen een bewijs van opslag nadat de backend zowel `scan_id` als `event_id` heeft teruggeleverd. Bij storing blijft het volledige gratis resultaat bruikbaar; geen valse succesmelding.
- Geen nieuwe scheduler, AI-provider, campagne, Brain, database, consent-omzeiling of fictieve conversie.

## Uitvoerings- en productcontract
Dit is een **eerste geïntegreerde lead-magnet-deelroute**, geen claim dat alle weggevers al actief zijn. Verbind nieuwe ingangen eerst aan het bestaande datacontract; pas daarna aan de Heartbeat-beslissingen, commerciële opvolging en klantgebonden portal-projecties. Alleen geverifieerde identiteit mag aggregate-only omzetten naar tenantcontext. 
Economische resultaten zijn niet afgeleid uit alleen scans of ingest: een gekwalificeerde lead, afspraak, order en gerealiseerde euro vragen elk apart bewijs.

## Acceptatiebewijs benodigd
1. Node regressietests voor selfscan, canonical fail-closed en idempotente ingest.
2. Protected CI + CodeQL + gereviewde merge op exacte commit.
3. Supabase Edge ACTIVE op **dezelfde source-versie**; Netlify productie op dezelfde GitHub main commit.
4. Publieke /zelfscan vult direct score en quick wins; werkelijke anonieme POST retourneert `scan_id`+`event_id`.
5. Readback uit de drie bestaande tabellen op één `submission_key`; privileged history/claim vanaf het publieke proxy verboden.
6. Authenticated klant-claim en daaropvolgende ONE BRAIN → POWERHOUSE → Heartbeat impact als afzonderlijke E2E-proef; P0 #4198 blijft open zolang feitelijke commerciële conversie niet bewezen is.

Fingerprint: `powerhouse|bedrijfslek|canonical-one-brain-ingest|v1`.
