# Powerhouse portal tenant identity normalization v1

**Canonical fingerprint:** `portal-tenant-identity-normalization-v1`

## Probleem

Portal-/intakedata gebruikte drie verschillende tenantpatronen: `organisaties.id`, vrije `klant_slug` en user-scoped `portaal_stand`. `scan_inzendingen` en `offerte_inzendingen` hadden bovendien een permissieve INSERT-policy met `WITH CHECK (true)`. Daardoor kon een slug worden opgeslagen zonder bewezen organisatie-lineage.

## Canonieke oplossing

- `public.organisaties.id` is tenant-authority.
- `scan_inzendingen`, `offerte_inzendingen` en `portaal_stand` krijgen `organisatie_id` met foreign key naar `organisaties(id)`.
- Intake-identiteit is expliciet `verified`, `demo` of `unverified`.
- `klant_slug` blijft compatibility-/displayinput, nooit authority.
- Authenticated intake kan alleen `verified` worden wanneer `auth.uid()` via `leden` aan die organisatie is gekoppeld.
- Publieke anonieme leadcaptatie blijft werken als `demo`/`unverified`, zonder tenant-authority.
- `portaal_stand` wordt user + organisatie scoped.
- Benchmarks en commerciële outcome-learning accepteren uitsluitend `verified` + `organisatie_id`.
- Demo/unverified evidence blijft bewaard maar kan niet stilzwijgend commerciële waarheid worden.

## Bestaande data

- Historische records met een bestaande organisatieslug krijgen de corresponderende `organisatie_id`, maar blijven `unverified` zolang de historische identity-evidence niet bewijst wie de write deed.
- Historische `demo`-records worden expliciet `demo` en krijgen geen commerciële organisatie.
- `portaal_stand` wordt alleen automatisch gemapt wanneer precies één membership bestaat; ambiguïteit blijft fail-closed.

## Truth boundary

Een URL-, formulier- of client-side slug geeft nooit rechten. Een geldige login alleen bewijst evenmin welke organisatie een businessrecord bezit. Alleen database-side membership kan authenticated intake `verified` maken.

Publieke leadcaptatie hoeft niet te verdwijnen om tenantveilig te zijn: `unverified` mag operationeel worden opgeslagen, maar niet in benchmark, advies, sales-outcome of learning worden gebruikt alsof het geverifieerde klantdata is.

## Existing-state / reuse-first

Geen nieuwe tenantstore, CRM, scheduler of learningdatabase. Bestaande `organisaties`, `leden`, intake-tabellen, benchmarkfuncties, outcome-triggers, `powerhouse_sales_learnings` en `powerhouse_runtime_events` blijven authority.

## Release- en bewijscontract

De wijziging is pas `LIVE & BEWEZEN` na:

1. exacte-head CI groen;
2. merge naar beschermde `main`;
3. Supabase production migration toegepast;
4. foreign keys en identity-statussen teruggelezen;
5. demo/unverified data aantoonbaar buiten benchmarks/outcomes;
6. permissieve `WITH CHECK (true)` policies verdwenen;
7. anonymous intake kan geen `verified` tenant claimen;
8. Powerhouse learning/runtime-event terugleesbaar;
9. Revenue Intelligence health niet gedegradeerd door de wijziging;
10. Human Handbook en Canonical System Map reflecteren dezelfde productiestaat.
