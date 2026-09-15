# Powerhouse Canonical Scan Loop v1

Fingerprint: `powerhouse-canonical-scan-loop-v1`

## Doel

Alle oude en nieuwe Frisse Blik-, website- en portaal-scans gebruiken één bestaande bron van waarheid: `public.scan_inzendingen`. Er komt geen tweede scan-store, brain, CRM, queue of learning-systeem bij.

## Canonieke keten

`frisse-blik website -> /api/powerhouse-scan-ingest -> Supabase Edge powerhouse-scan-ingest -> scan_inzendingen -> powerhouse_runtime_events + growth_events -> portal scan history -> identity verification -> scan_identity_verified -> bestaande Powerhouse intelligence / opportunities / next-best-action / outcomes / learning`.

## Bestaande componenten die worden hergebruikt

- `scan_inzendingen`: canonieke scanbron, inclusief legacy records.
- `portal/` + bestaande portal identity en server-state.
- `powerhouse_runtime_events`: event-lineage.
- `growth_events`: website/funnel observatie.
- Bestaande Powerhouse predictive, company intelligence, opportunity, forecast, next-best-action, outcome en learning tabellen/views.
- Netlify server functions voor browser -> server vertrouwensgrens.
- Supabase Edge Functions met `x-bg-service-token`; service token staat nooit in browsercode.

## Data- en identityregels

1. Publieke website-scans starten altijd `tenant_identity_status=unverified` en `company_key=NULL`.
2. Browserpayload mag nooit zelf verified identity, `organisatie_id` of `company_key` bepalen.
3. Unverified scans mogen Powerhouse alleen als `aggregate_only` learning evidence voeden.
4. Na geauthenticeerde portal identity kan de lokale scan via `submission_key` worden geclaimd.
5. Claim kan alleen wanneer de portal tenant een bestaande `organisaties.id` UUID is.
6. Verificatie wijzigt de scan naar `verified` en emit een nieuw append-only `scan_identity_verified` runtime-event; het oorspronkelijke `scan_submitted` event blijft provenance.
7. Dedupe gebeurt op `submission_key`; runtime dedupe-key is `scan:<submission_key>`.
8. Oude scans worden niet herschreven. `powerhouse_scan_history_v1` projecteert legacy en v2 samen en berekent score-delta's.

## Contract v2

Aan `scan_inzendingen` toegevoegd:

- `submission_key`
- `schema_version`
- `payload`
- `powerhouse_event_id`
- `company_key`
- `bron_url`
- `bijgewerkt_op`

De lossless `payload` bevat dimensies, antwoorden en provenance. De bestaande kolommen blijven voor backward compatibility en reporting.

## Runtime-events

### `scan_submitted`

Bron `website.frisse_blik`, kanaal `website`, topic `digital_maturity`, `data_quality=OBSERVED`, confidence `0.9`, learning scope `aggregate_only`.

### `scan_identity_verified`

Bron `portal.identity`, kanaal `portal`, verified company key, `data_quality=VERIFIED`, confidence `1.0`, learning scope `account_and_aggregate`.

## Portal

`/api/portal-scans` gebruikt dezelfde Netlify Identity als `/api/portal-state` en dezelfde `resolveIdentityTenant` authority. Na login:

- POST claimt een lokale scan indien de tenant een organisatie-UUID is;
- GET leest maximaal 50 scans uit `powerhouse_scan_history_v1`;
- `assets/klantportaal-scan-history.js` toont oude en nieuwe scans en de delta sinds de vorige scan.

Zonder login blijft de zojuist uitgevoerde scan lokaal zichtbaar via de bestaande portalflow; de server claimt niets zonder bewezen identity.

## Website

`assets/frisse-blik-powerhouse.js` observeert uitsluitend een nieuw, tijdens de huidige Frisse Blik-sessie opgeslagen `bg_scan_pakket`. Een al aanwezige oude localStorage-scan wordt niet opnieuw ingestuurd. Het script gebruikt `fetch(..., keepalive:true)` naar de same-origin Netlify API, bewaart een receipt en houdt bij fout een lokale pending record voor herstel.

## Security

- RLS op `scan_inzendingen` blijft aan.
- Geen anon/authenticated table policy toegevoegd.
- Alle databasewrites gaan via server/service-role na custom service-token auth.
- Publieke client kan geen tenant/company authority kiezen.
- PII wordt niet toegevoegd aan scan runtime events of growth events.
- Canonical URL is fail-closed op `https://www.bedrijfsgeheugen.nl/frisse-blik`.

## Observability en readback

Productie is pas bewezen wanneer minimaal groen zijn:

- Supabase migration aanwezig en kolommen/view leesbaar;
- `powerhouse-scan-ingest` ACTIVE;
- server health meldt contract, scan-store en count;
- website bevat de bridge script-load;
- Netlify endpoint `/api/powerhouse-scan-ingest` antwoordt health;
- GitHub Required `test` check groen;
- live website deployment is current;
- Powerhouse current-state/evidence writeback bevat commit/deploy/readback.

## Rollback

Browserbridge kan worden verwijderd zonder historische data te verwijderen. Edge function kan worden teruggezet naar vorige versie. Nieuwe kolommen zijn additive en legacy-compatible; rollback verwijdert ze niet automatisch. Scanrecords en runtime-events worden niet destructief teruggerold.

## Lifecycle

Status: `active` zodra alle productie-readbacks groen zijn. Eigenaar/authority: Bedrijfsgeheugen Powerhouse. Make is geen onderdeel van deze keten.
