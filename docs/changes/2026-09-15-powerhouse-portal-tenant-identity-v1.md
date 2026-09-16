# Powerhouse portal tenant identity normalization v1

**Canonical fingerprint:** `portal-tenant-identity-normalization-v1`

## Probleem

Portal-/intakedata gebruikte drie verschillende tenantpatronen: `organisaties.id`, vrije `klant_slug` en user-scoped `portaal_stand`. `scan_inzendingen` en `offerte_inzendingen` hadden bovendien een permissieve INSERT-policy met `WITH CHECK (true)`. Daardoor kon een slug worden opgeslagen zonder bewezen organisatie-lineage.

## Canonieke oplossing

- `public.organisaties.id` is tenant-authority.
- `scan_inzendingen`, `offerte_inzendingen` en `portaal_stand` hebben `organisatie_id` met foreign key naar `organisaties(id)`.
- Intake-identiteit is expliciet `verified`, `demo` of `unverified`.
- `klant_slug` blijft compatibility-/displayinput, nooit authority.
- Authenticated intake kan alleen `verified` worden wanneer `auth.uid()` via `leden` aan die organisatie is gekoppeld.
- De bestaande productiehelper `intern.mijn_organisaties()` is de membership-authority voor RLS.
- Publieke anonieme leadcaptatie blijft werken als `demo`/`unverified`, zonder tenant-authority.
- `portaal_stand` is user + organisatie scoped.
- Benchmarks en commerciële outcome-learning accepteren uitsluitend `verified` + `organisatie_id`.
- Demo/unverified evidence blijft bewaard maar kan niet stilzwijgend commerciële waarheid worden.

## Bestaande data

- Historische records met een bestaande organisatieslug kregen de corresponderende `organisatie_id`, maar blijven `unverified` zolang de historische identity-evidence niet bewijst wie de write deed.
- Historische `demo`-records zijn expliciet `demo` en hebben geen commerciële organisatie.
- `portaal_stand` is alleen automatisch gemapt waar precies één membership bestond; ambiguïteit blijft fail-closed.

## Truth boundary

Een URL-, formulier- of client-side slug geeft nooit rechten. Een geldige login alleen bewijst evenmin welke organisatie een businessrecord bezit. Alleen database-side membership kan authenticated intake `verified` maken.

Publieke leadcaptatie hoeft niet te verdwijnen om tenantveilig te zijn: `unverified` mag operationeel worden opgeslagen, maar niet in benchmark, advies, sales-outcome of learning worden gebruikt alsof het geverifieerde klantdata is.

## Existing-state / reuse-first

Geen nieuwe tenantstore, CRM, scheduler of learningdatabase. Bestaande `organisaties`, `leden`, intake-tabellen, benchmarkfuncties, outcome-triggers, `powerhouse_sales_learnings` en `powerhouse_runtime_events` blijven authority.

## Release- en bewijscontract

De wijziging is alleen `LIVE & BEWEZEN` wanneer:

1. exacte-head CI groen is;
2. merge naar beschermde `main` is uitgevoerd;
3. Supabase production migration is toegepast;
4. foreign keys en identity-statussen zijn teruggelezen;
5. demo/unverified data aantoonbaar buiten benchmarks/outcomes blijft;
6. permissieve `WITH CHECK (true)` policies verdwenen zijn;
7. anonymous intake geen `verified` tenant kan claimen;
8. Powerhouse learning/runtime-event terugleesbaar is;
9. relevante security/release-gates groen zijn;
10. Human Handbook en Canonical System Map dezelfde productiestaat reflecteren.

## Productie-readback — 15 september 2026

**Status: LIVE & BEWEZEN.**

- Implementatie-PR #1611 is gemerged op `461a28f4573593f40feebc718c8813e0667ad83b`.
- Runtime-dependencyfix PR #1615 is gemerged op `a3db1953f33bf94e873e4bbe365b2eb006522bff`.
- Supabase migration `powerhouse_tenant_identity_hardening_v1` staat in productie als versie `20260915165017`.
- Productie-readback toont de nieuwe `organisatie_id`-kolommen, verplichte `tenant_identity_status` op scan/offerte en drie actieve identity-triggers.
- De oude open intakepolicies zijn verdwenen: `legacy_open_policies = 0`.
- Authenticated RLS gebruikt de bestaande canonical membership-helper `intern.mijn_organisaties()`; anon kan alleen `demo`/`unverified` zonder `organisatie_id` schrijven.
- Scan- en offertebenchmarkfuncties eisen zowel `tenant_identity_status='verified'` als een niet-lege `organisatie_id`.
- Scan- en offerte-outcometriggers blokkeren commerciële learning wanneer tenantidentiteit niet `verified` is.
- Historische IJsselmonde-records zijn deterministisch aan de bestaande organisatie gekoppeld maar bewust `unverified`; zes historische demo-records zijn expliciet `demo` met `organisatie_id = null`.
- De bestaande portal-state is organisatiegebonden teruggelezen.
- Powerhouse learning `portal-tenant-identity-normalization-v1` staat `proven` met confidence `1.0`.
- Runtime-event `portal-tenant-identity-normalization-v1:activation` staat `actioned`, `data_quality=verified`, confidence `1.0`.

## Incident en permanente preventie

De eerste productie-apply werd atomair afgebroken omdat de migratie naar de niet-bestaande helper `public.mijn_organisaties()` verwees. Productie-inspectie bewees dat de bestaande authority `intern.mijn_organisaties()` is. Er is geen compatibility-wrapper of parallelle helper gemaakt: de migratie is reuse-first gecorrigeerd naar de bestaande functie.

De regressietest vereist sindsdien expliciet `intern.mijn_organisaties()` en verbiedt `public.mijn_organisaties()`. Daarmee is de concrete preventieregel: **runtime-afhankelijke database-identifiers moeten tegen de actuele productieauthority worden gevalideerd; CI-patroonchecks alleen zijn onvoldoende bewijs van deploybaarheid.**

Voor de gecorrigeerde exacte head `a12a96c46f809582911be459d64bab4f0081da12` zijn Required test, Powerhouse Supabase Security Contract, BRAIN delivery, V18 Production Promotion, Revenue Learning, Brain foundation en de relevante shell/readback-checks groen teruggelezen.
