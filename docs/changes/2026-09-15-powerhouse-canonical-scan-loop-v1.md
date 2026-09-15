# 2026-09-15 — Powerhouse Canonical Scan Loop v1

Fingerprint: `powerhouse-canonical-scan-loop-v1`

## Doel

Alle oude en nieuwe Frisse Blik-, website- en portaal-scans gebruiken één bestaande bron van waarheid: `public.scan_inzendingen`. Er komt geen tweede scan-store, brain, CRM, queue of learning-systeem bij.

## Canonieke keten

`frisse-blik website -> /api/powerhouse-scan-ingest -> Supabase Edge powerhouse-scan-ingest -> scan_inzendingen -> powerhouse_runtime_events + growth_events -> portal scan history -> identity verification -> scan_identity_verified -> bestaande Powerhouse intelligence / opportunities / next-best-action / outcomes / learning`.

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

## Runtime-events

`scan_submitted`: bron `website.frisse_blik`, kanaal `website`, topic `digital_maturity`, `data_quality=OBSERVED`, confidence `0.9`, learning scope `aggregate_only`.

`scan_identity_verified`: bron `portal.identity`, kanaal `portal`, verified company key, `data_quality=VERIFIED`, confidence `1.0`, learning scope `account_and_aggregate`.

## Portal

`/api/portal-scans` gebruikt dezelfde Netlify Identity als `/api/portal-state` en dezelfde `resolveIdentityTenant` authority. POST claimt een lokale scan voor een bewezen organisatie-UUID; GET leest maximaal 50 scans uit `powerhouse_scan_history_v1`; `assets/klantportaal-scan-history.js` toont oude en nieuwe scans plus score-delta. Zonder login blijft de bestaande lokale portalflow werken en wordt niets server-side geclaimd.

## Website

`assets/frisse-blik-powerhouse.js` observeert alleen een nieuw scanpakket dat tijdens de actuele Frisse Blik-sessie in `bg_scan_pakket` verschijnt. Bestaande localStorage-data wordt niet opnieuw ingestuurd. De bridge gebruikt `fetch(..., keepalive:true)` naar de same-origin Netlify API, bewaart een server receipt en een herstelrecord bij transportfout.

## Security

- RLS op `scan_inzendingen` blijft actief.
- Geen anon/authenticated table policy toegevoegd.
- `powerhouse_scan_history_v1` is expliciet `security_invoker`, browserrollen zijn gerevoked, alleen `service_role` krijgt SELECT.
- Alle writes gaan via server/service-role na custom service-token auth.
- Publieke client kan geen tenant/company authority kiezen.
- PII wordt niet toegevoegd aan scan runtime/growth events.
- Canonical URL is fail-closed op `https://www.bedrijfsgeheugen.nl/frisse-blik`.

## Productiehandelingen

- Additieve migration `powerhouse_canonical_scan_loop_v1` toegepast op productieproject `adhjwmvyoixzjtmiroln`.
- Security-hardening migration `powerhouse_canonical_scan_loop_v1_security` toegepast.
- Edge Function `powerhouse-scan-ingest` ACTIVE v2.
- Vier bestaande historische scanrecords behouden.
- Implementatie in PR #1622; protected-main Required gate blijft authority voor merge.

## Verificatiecontract

Productie geldt pas als bewezen wanneer: migration/read-model leesbaar is; Edge Function ACTIVE is; server-health contract/store/count teruggeeft; live website de bridge laadt; `/api/powerhouse-scan-ingest` health groen is; `/api/portal-scans` zonder auth fail-closed reageert; GitHub Required `test` groen is; Netlify productie op de merge-SHA staat; en de Powerhouse current-state/evidence writeback commit/deploy/readback bevat.

## Rollback en continuïteit

De browserbridge kan worden verwijderd zonder historische data te verwijderen. De Edge Function kan naar de vorige versie worden teruggezet. Databasewijzigingen zijn additief en legacy-compatible; scanrecords en runtime-events worden niet destructief teruggedraaid. Make is geen onderdeel van de keten.

## Lifecycle

Status tijdens deze record: `deploying`; pas na alle readbacks wordt dit `active / LIVE & BEWEZEN`. Eigenaar/authority: Bedrijfsgeheugen Powerhouse.
