# 2026-09-15 — Powerhouse Canonical Scan Loop v1

Fingerprint: `powerhouse-canonical-scan-loop-v1`

## Doel

Alle oude en nieuwe Frisse Blik-, website- en portaal-scans gebruiken één bestaande bron van waarheid: `public.scan_inzendingen`. Er komt geen tweede scan-store, brain, CRM, queue of learning-systeem bij.

## Canonieke keten

`frisse-blik website -> lokale scan-handoff -> klantportaal compatibility bridge -> /api/powerhouse-scan-ingest -> Supabase Edge powerhouse-scan-ingest -> scan_inzendingen -> powerhouse_runtime_events + growth_events -> portal scan history -> identity verification -> scan_identity_verified -> bestaande Powerhouse intelligence / opportunities / next-best-action / outcomes / learning`.

## Hergebruikte authority

- `scan_inzendingen`: canonieke scanbron, inclusief legacy records.
- `portal/` + bestaande portal identity en server-state.
- `powerhouse_runtime_events`: event-lineage.
- `growth_events`: website/funnel observatie.
- Bestaande Powerhouse predictive, company-intelligence, opportunity, forecast, next-best-action, outcome en learning tabellen/views.
- Netlify server functions voor browser -> server vertrouwensgrens.
- Supabase Edge Functions met `x-bg-service-token`; service token staat nooit in browsercode.

## Data- en identityregels

1. Publieke website-scans starten altijd `tenant_identity_status=unverified` en `company_key=NULL`.
2. Browserpayload mag nooit verified identity, `organisatie_id` of `company_key` bepalen.
3. Unverified scans mogen Powerhouse alleen als `aggregate_only` evidence voeden.
4. Na geauthenticeerde portal identity kan de lokale scan via `submission_key` worden geclaimd.
5. Claim kan alleen wanneer de portal tenant een bestaande `organisaties.id` UUID is.
6. Verificatie wijzigt de scan naar `verified` en emit een append-only `scan_identity_verified` runtime-event; `scan_submitted` blijft provenance.
7. Dedupe gebeurt op `submission_key`; runtime dedupe-key is `scan:<submission_key>`.
8. Oude scans worden niet herschreven. `powerhouse_scan_history_v1` projecteert legacy en v2 samen en berekent score-delta's.

## Contract v2

Additief toegevoegd aan `scan_inzendingen`: `submission_key`, `schema_version`, `payload`, `powerhouse_event_id`, `company_key`, `bron_url`, `bijgewerkt_op`. De lossless `payload` bevat dimensies, antwoorden en provenance; bestaande kolommen blijven voor backward compatibility en reporting.

`submission_key` heeft daarnaast een expliciete canonieke UNIQUE constraint (`scan_inzendingen_submission_key_key`), vastgelegd in migratie `20260915193200_scan_submission_key_unique_constraint.sql`. Dit is de database-authority achter de PostgREST `onConflict:'submission_key'` idempotency en laat historische NULL-keys intact.

## Runtime-events

`scan_submitted`: bron `website.frisse_blik`, kanaal `website`, topic `digital_maturity`, `data_quality=OBSERVED`, confidence `0.9`, learning scope `aggregate_only`.

`scan_identity_verified`: bron `portal.identity`, kanaal `portal`, verified company key, `data_quality=VERIFIED`, confidence `1.0`, learning scope `account_and_aggregate`.

## Portal

`/api/portal-scans` gebruikt dezelfde Netlify Identity als `/api/portal-state` en dezelfde `resolveIdentityTenant` authority. POST claimt een lokale scan voor een bewezen organisatie-UUID; GET leest maximaal 50 scans uit `powerhouse_scan_history_v1`; `assets/klantportaal-scan-history.js` toont oude en nieuwe scans plus score-delta. Zonder login blijft de bestaande lokale portalflow werken en wordt niets server-side geclaimd.

## Website en scan-handoff

De bestaande `frisse-blik.html` blijft ongewijzigd als scan-UI en compatibility authority. Na afronding schrijft die het scanpakket naar `bg_scan_pakket` in `localStorage` en verwijst vervolgens door naar `/klantportaal#direct`. De bestaande portal-bridge `assets/klantportaal-scan-history.js` maakt voor een lokaal pakket zonder sleutel eerst een stabiele `submission_key`, schrijft de scan daarna server-side via `/api/powerhouse-scan-ingest`, bewaart een receipt zodat dezelfde scan niet dubbel wordt ingestuurd en voert pas daarna de identity-claim via `/api/portal-scans` uit. Bij transportfout blijft het lokale scanpakket behouden voor herstel; identity blijft fail-closed. Er wordt bewust geen extra `<script>` in `frisse-blik.html` geïnjecteerd.

## Security

- RLS op `scan_inzendingen` blijft actief.
- Geen anon/authenticated table policy toegevoegd.
- `powerhouse_scan_history_v1` is expliciet `security_invoker`, browserrollen zijn gerevoked, alleen `service_role` krijgt SELECT.
- Alle writes gaan via server/service-role na custom service-token auth.
- Publieke client kan geen tenant/company authority kiezen.
- De publieke Netlify-route `/api/powerhouse-scan-ingest` accepteert alleen scan-ingest en health; privileged Edge-acties `history` en `claim` worden vóór de service-token grens fail-closed geweigerd met `403 PRIVILEGED_ACTION_FORBIDDEN`.
- `/api/portal-scans` blijft de enige browserroute voor history/claim en vereist Netlify Identity plus een door `resolveIdentityTenant` bewezen tenant.
- PII wordt niet toegevoegd aan scan runtime/growth events.
- Canonical URL is fail-closed op `https://www.bedrijfsgeheugen.nl/frisse-blik`.

## Productiehandelingen

- Additieve migration `powerhouse_canonical_scan_loop_v1` toegepast op productieproject `adhjwmvyoixzjtmiroln`.
- Security-hardening migration `powerhouse_canonical_scan_loop_v1_security` toegepast.
- Canonieke `submission_key` UNIQUE constraint is in productie aanwezig en in de repository gemigreerd.
- Edge Function `powerhouse-scan-ingest` ACTIVE v2.
- Vier bestaande historische scanrecords zijn bij introductie van v2 behouden.
- Implementatie van de canonieke loop gemerged via PR #1622.
- `scan-public-proxy-v2` voegt een expliciet publiek proxycontract toe en sluit privileged Edge-acties buiten de authenticated portalroute.
- `.github/workflows/powerhouse-scan-production-proof.yml` is de permanente productie-proof lane voor deze capability en gebruikt geen parallelle datastore of learning authority.

## Productie-proof contract

Iedere relevante main-release van de scanloop moet vanaf een externe GitHub runner de echte productieomgeving bewijzen. Dit geldt ook voor scan-gerelateerde database-migraties.

1. `GET https://www.bedrijfsgeheugen.nl/api/powerhouse-scan-ingest` retourneert `ok=true`, contract `powerhouse-canonical-scan-loop-v1` en proxycontract `scan-public-proxy-v2`.
2. `GET https://www.bedrijfsgeheugen.nl/api/portal-scans` zonder identity retourneert exact `401 UNAUTHORIZED`.
3. Publieke POST-pogingen met `action=history` en `action=claim` retourneren exact `403 PRIVILEGED_ACTION_FORBIDDEN` en bereiken de privileged Edge-route niet.
4. Iedere relevante release schrijft een gecontroleerde scan met sleutel `scan-prod-smoke-<main-sha>` één keer canoniek; de tweede identieke POST moet `deduped=true` retourneren met exact hetzelfde `scan_id` en `event_id`.
5. De smoke-scan blijft bewust `tenant_identity_status=unverified`; er wordt geen fictieve organisatie geclaimd.
6. De workflow summary bewaart `submission_key`, `scan_id`, `event_id` en beide responses als release-evidence.

Een scanrelease is alleen `LIVE & BEWEZEN` wanneer deze production-proof run groen is op de actuele productiecode. Een deploy zonder deze readback is maximaal `DEELS LIVE`.

## Verificatiecontract

Productie geldt pas als bewezen wanneer: migration/read-model leesbaar is; Edge Function ACTIVE is; server-health contract/store/count teruggeeft; live klantportaal de bridge laadt; `/api/powerhouse-scan-ingest` health groen is; `/api/portal-scans` zonder auth fail-closed reageert; privileged public actions fail-closed zijn; gecontroleerde dubbele ingest dezelfde `scan_id` en `event_id` terugleest; GitHub Required `test` groen is; Netlify productie op de merge-SHA staat; en de Powerhouse current-state/evidence/learning writeback commit/deploy/readback bevat.

## Preventieregels uit deze release

- Injecteer geen browserbridge via een globale string-replace op `</body>` in een HTML-bestand dat zelf HTML-documenten als JavaScript-string opbouwt. Een letterlijk `</script>` in zo'n gegenereerde string kan het buitenste inline script voortijdig sluiten. Hergebruik de bestaande navigatie-/handoffgrens en laat de syntax-preflight fail-closed bewijzen dat inline JavaScript parsebaar blijft.
- Een serverproxy met een service-token mag nooit generiek alle upstream actions doorgeven. Publieke en privileged actions moeten vóór de secret/service-role grens expliciet worden gescheiden en fail-closed getest.
- Een idempotencycontract moet niet alleen in runtimecode bestaan: de bijbehorende database-constraint is repository-authority en scanmigraties moeten dezelfde productie-proof triggeren.
- Deploymentmetadata alleen is geen productiebewijs. Kritieke serverless routes moeten vanaf een externe runner functioneel worden uitgelezen; voor idempotente writes moet dezelfde release ook een gecontroleerde dubbele write/readback aantonen.
- Tijdelijke branch-only verificatieworkflows worden na gebruik verwijderd; permanente verificatie hoort in de canonieke production-proof lane.

## Rollback en continuïteit

De portalbridge kan worden verwijderd zonder historische data te verwijderen. De Edge Function kan naar de vorige versie worden teruggezet. Databasewijzigingen zijn additief en legacy-compatible; scanrecords en runtime-events worden niet destructief teruggedraaid. De public-proxy hardening kan onafhankelijk worden teruggedraaid, maar alleen als een gelijkwaardige fail-closed trust-boundary aanwezig is. Smoke-records zijn herkenbaar aan `branche=production-smoke`, `doel=__PRODUCTION_SMOKE__` en `submission_key=scan-prod-smoke-*`; ze zijn evidence en worden niet als klantidentity gebruikt. Make is geen onderdeel van de keten.

## Lifecycle

Authority-status is runtime-afgeleid: `active / LIVE & BEWEZEN` uitsluitend wanneer de actuele main-release door Required, exacte productie-deploy/readback en `Powerhouse Scan Production Proof` groen is bewezen. Bij ontbrekende of rode production-proof is de status automatisch `DEELS LIVE` of `GEBLOKKEERD`; een statische documentregel mag die runtimewaarheid nooit overrulen. Eigenaar/authority: Bedrijfsgeheugen Powerhouse.
