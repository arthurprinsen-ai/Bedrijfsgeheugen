# Powerhouse canonical scan production proof v1

**Contract:** `powerhouse-canonical-scan-loop-v1`  
**Public proxy contract:** `scan-public-proxy-v2`  
**Canonical authority:** `public.scan_inzendingen`  
**Production proof workflow:** `.github/workflows/powerhouse-scan-production-proof.yml`

## Canonieke keten

Website/portaal/future scan -> server-side scan ingest -> `scan_inzendingen` -> `powerhouse_runtime_events` -> bestaande Powerhouse intelligence/actie/learning-keten. Er is geen tweede scanstore. Ongeverifieerde publieke scans blijven `tenant_identity_status=unverified`, zonder `company_key` en met `learning_scope=aggregate_only` totdat identiteit via de geauthenticeerde portalroute wordt bevestigd.

## Security boundary

De publieke Netlify-route `/api/powerhouse-scan-ingest` mag alleen health en publieke scan-ingest doorgeven. `history` en `claim` zijn privileged acties en worden publiek fail-closed met HTTP 403 `PRIVILEGED_ACTION_FORBIDDEN`. De portal-scanroute blijft zonder geldige identiteit fail-closed met HTTP 401 `UNAUTHORIZED`.

## Productie-incidenten en root causes

1. **Privileged action exposure.** De publieke proxy stuurde willekeurige action-payloads met de server-token door naar de Supabase Edge Function. Preventie: publieke proxy begrenst de action-surface; privileged identity/history blijft achter portal-auth.
2. **Idempotency schema drift.** Runtime gebruikte `ON CONFLICT (submission_key)` terwijl `scan_inzendingen.submission_key` geen UNIQUE invariant had. Preventie: database-backed uniqueness is verplicht voor iedere runtime-idempotency key. Productie en repo bevatten `scan_inzendingen_submission_key_key`.
3. **Derived benchmark trigger versus DELETE safety guard.** `benchmark_projection.refresh_scan_benchmarks()` deed volledige DELETE-statements zonder WHERE; de database safety guard blokkeerde daardoor iedere scaninsert. Preventie: derived projection refreshes gebruiken expliciete bounded/intentional DELETE-contracten; de huidige functie gebruikt `WHERE true`, terwijl `scan_inzendingen` authority blijft.
4. **Proof path coverage.** De eerste schemafix activeerde de scan production proof niet, omdat scanmigraties buiten de workflow-pathfilter vielen. Preventie: `supabase/migrations/*scan*` valt nu onder dezelfde production proof.

## Productiebewijs 15 september 2026

Merge `4a4c449efcab62fc81a0215ba415fc3bcdfa0082` activeerde `Powerhouse Scan Production Proof` run `35015206432`. Na herstel van de benchmark-trigger is dezelfde gefaalde run opnieuw uitgevoerd zonder applicatiecodewijziging; attempt/job `104537175416` eindigde volledig groen.

Bewezen in één live run:
- health: `powerhouse-canonical-scan-loop-v1`, store `scan_inzendingen`, proxy `scan-public-proxy-v2`;
- unauthenticated `/api/portal-scans`: 401 `UNAUTHORIZED`;
- publieke `history` en `claim`: 403 `PRIVILEGED_ACTION_FORBIDDEN`;
- gecontroleerde scan `scan-prod-smoke-4a4c449efcab` twee keer ingestuurd;
- beide writes wezen naar dezelfde scan `145cf5b6-3d1b-46ab-8ca1-9c66f0510cab` en hetzelfde runtime-event `3614993a-056d-4c00-ab17-bce183831fe9`;
- database-readback: `bron=website`, `tenant_identity_status=unverified`, `organisatie_id/company_key=NULL`, Powerhouse event `scan_submitted`, `source=website.frisse_blik`, `learning_scope=aggregate_only`, data quality `OBSERVED`, confidence `0.9`;
- growth lineage bevatte `scan_completed` met dezelfde scan-id en `privacy_scope=no_pii`;
- synthetische smoke-data is na readback exact verwijderd; cleanup-readback: scans=0, runtime_events=0, growth_events=0.

## Permanente preventieregels

- API-idempotency is pas bewezen wanneer de database dezelfde uniqueness-invariant afdwingt.
- Privileged service-token capabilities mogen nooit impliciet via een publieke proxy bereikbaar zijn.
- Elke scan-gerelateerde function- of schemamutatie valt onder dezelfde productieproof.
- Derived projection refreshes mogen de canonical ingest niet blokkeren; security/safety guards worden niet verzwakt om projectielogica te laten werken.
- Productie-E2E gebruikt herkenbare synthetische markers, controleert exact één canonical row/event ondanks replay, en verwijdert uitsluitend die gemarkeerde data na readback.
- Geen `LIVE & BEWEZEN` zonder live health/auth/security/write/dedupe/database-readback en cleanup-evidence.
