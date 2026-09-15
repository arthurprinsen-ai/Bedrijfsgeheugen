# Powerhouse portal tenant identity normalization v1

**Canonical fingerprint:** `portal-tenant-identity-normalization-v1`

## Probleem

Portal-/intakedata gebruikte drie verschillende tenantpatronen: `organisaties.id`, vrije `klant_slug` en user-scoped `portaal_stand`. `scan_inzendingen` en `offerte_inzendingen` hadden bovendien een permissieve INSERT-policy met `WITH CHECK (true)`. Daardoor was een slug feitelijk input, maar niet cryptografisch/database-technisch gekoppeld aan de organisatie van de ingelogde gebruiker.

## Canonieke oplossing

- `public.organisaties.id` is tenant-authority.
- `scan_inzendingen`, `offerte_inzendingen` en `portaal_stand` krijgen `organisatie_id` met foreign key naar `organisaties(id)`.
- Bestaande echte `ijsselmonde`-records worden via `organisaties.slug` gemigreerd.
- `portaal_stand` wordt via `leden.gebruiker_id → leden.organisatie_id` gemigreerd.
- Historische `demo`-records krijgen expliciet `is_demo=true` en geen commerciële organisatie.
- Authenticated intakewrites worden database-side naar membership genormaliseerd; `klant_slug` blijft alleen compatibility-/display-alias.
- Anonymous intake INSERT wordt verwijderd.
- Benchmarks gebruiken alleen `is_demo=false AND organisatie_id IS NOT NULL`.
- Scan-/offerte-outcomes slaan demo/unowned data fail-closed over en schrijven `organisatie_id` als provenance.

## Truth boundary

Een URL-, formulier- of client-side slug geeft nooit rechten. Een geldige login alleen bewijst evenmin welke organisatie een businessrecord bezit. Alleen de combinatie `auth.uid() → leden → organisaties.id` autoriseert authenticated portalwrites.

Demo-/voorbeelddata mag geen benchmark, advies, sales-outcome of learning beïnvloeden.

## Existing-state / reuse-first

Geen nieuwe tenantstore, CRM, scheduler of learningdatabase. Bestaande `organisaties`, `leden`, intake-tabellen, benchmarkfuncties, outcome-triggers, `powerhouse_sales_learnings` en `powerhouse_runtime_events` blijven authority.

## Release- en bewijscontract

De wijziging is pas `LIVE & BEWEZEN` na:

1. exacte-head CI groen;
2. merge naar beschermde `main`;
3. Supabase production migration toegepast;
4. alle echte intake-/portalrecords hebben een geldige `organisatie_id`;
5. alle historische demo-intakes zijn expliciet demo en hebben geen organisatie;
6. geen permissieve `WITH CHECK (true)` intakepolicy blijft bestaan;
7. benchmark- en outcomefuncties bevatten de fail-closed tenant/demo-gates;
8. Powerhouse learning/runtime-event is terugleesbaar;
9. Human Handbook en Canonical System Map reflecteren dezelfde staat.
