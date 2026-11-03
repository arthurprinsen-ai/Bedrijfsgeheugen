# ONE BRAIN CRO commerciële terugkoppeling — runtime en portaal (30 oktober 2026)

**Owner**: bestaande Powerhouse Growth & Revenue OS, oorspronkelijke `powerhouse-commercial-heartbeat-runner`, ONE BRAIN `brain_records`, het originele Portal V2 → Data & intelligence → Andere data.

**Root cause**: PR #5177 voegde een zevenpoortscontract toe aan een pure `heartbeatGrowthTick`-bibliotheek, zonder aanroep in een natuurlijke productie-run. De bestaande Edge-runner voerde commerciële Heartbeat- en outbound-activiteiten uit zonder CRO-bewijssnapshot naar ONE BRAIN te schrijven. Het originele portaal kende de zeven ontbrekende bewijzen niet.

## Gecontroleerde baseline
Supabase productie op 30 oktober: commerciële cron #116 en runtime mux #171 actief en recent geslaagd. `powerhouse_cro_conversion_evidence_v1`: 0 CTA-events in 7d, 0 gekoppelde kwalificatie in 30d, 0 orderrecords met providerreferentie in 30d. `powerhouse_cro_experiment_evidence_v1`: 1 volwassen treatment en 0 holdout (minimum 20 per arm). De eerder aangetroffen `delivery-disabled` achterstand is geen vrijgave om BG211 massaal te heractiveren.

## Reparatie in bestaande code
- Original Supabase Edge `powerhouse-commercial-heartbeat-runner` houdt de ongewijzigde service-tokenbeveiliging en de normale Heartbeat aan. Na een succesvolle bestaande run leest hij de twee originele CRO-readmodellen; binnen een onafhankelijke, begrensde transactie schrijft hij **een bestaand dagrecord** in `public.brain_records` onder `canonical/cro-commercial-evidence:YYYY-MM-DD`. Exacte idempotentie via originele `(tenant_id,idempotency_key)` en originele owner; readback volgt ná commit.
- Het record heeft `executed=true` voor de technische meting maar `verified=false`, `status=OBSERVED`, zeven expliciete `verified` bewijsstappen en `business_outcome_verified=false`. Een bron-ACK, CTA, kwalificatierecord of providerreferentie mag nooit als onafhankelijk betaald klantresultaat gelden. De niet-beschikbare onafhankelijke bronbewijzen blijven `false`. Geen nieuwe schema/migratie, scheduler of parallel Brain.
- De bestaande Netlify admin-only `powerhouse-cro-other-data.mjs` leest uitsluitend tenant `canonical`, recordtype `Verification`, oorspronkelijke owner, expliciete `record_id`-prefix; maximaal één vers record. Het failt op ontbrekende, dubbele, ongeldige, verouderde of toekomstige readback. De bestaande pagina `portal-v2/modules/andere-data.js` toont de zeven gates, technische readback, cohort en onbekende onafhankelijke omzet. Alle gebruikerswaarden worden geescaped; auth en no-store blijven.
- `status=LIVE` van de bestaande readmodel-API is alleen bereikbaarheid van bronnen. De afzonderlijke `commercialLoopStatus` wordt pas bewijsbaar na de onafhankelijke klant- en providerketen en een volgende natuurlijke Brain-leerverbetering. Dit pakket kan die resultaten niet verzinnen.

## Regressie en vrijgave
Run `node --test tests/brain-cro-commercial-runtime-portal-20261030.test.mjs tests/portal-cro-other-data.test.mjs tests/brain-cro-other-data.test.mjs`, plus exact-head Required/BRAIN/CodeQL. Protected merge, Netlify exact deployed SHA, original Supabase Edge ACTIVE+code hash, natuurlijke Heartbeat-run, onafhankelijke `brain_records` readback en geauthenticeerde twee-tenantportalcontrole zijn **losse verplichtingen**. Deploy dezelfde Edge code alleen na protected main en met exact bestaande `verify_jwt=false` omdat de origineel beveiligde service-token route ongewijzigd is. Geen geforceerde Netlify-run of dubbele kanalen.

## Menselijke herstelinstructie
Bij terugval: vergelijk het originele dagrecord en de bronviews, de volgende cronrun, Edge-versie en API-bronstatus. Bij `EVIDENCE_UNAVAILABLE` controleer een afzonderlijke database/timeout/tenant-fout; herstel binnen de originele Heartbeat-owner en toets het echte resultaat na herstart van de natuurlijke run. Houd de oorspronkelijke incidentfingerprint, eigenaar, metingen, oorzaak en regressie aan in ONE BRAIN. Werk relevante SkillOps en portaal samen bij; wijzig de System Map alleen via zijn bestaande exclusieve writer (de actuele #5172 portfolio-procedure). Een los GitHub-codeverschil is **geen** productiebewijs.

**Status bij aanmaak**: SOURCE_CANDIDATE / NOT_LIVE / INDEPENDENT_COMMERCIAL_OUTCOMES_UNVERIFIED.
