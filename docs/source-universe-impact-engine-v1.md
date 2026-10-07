# Source Universe & Company Impact Engine v1

## Doel

Bedrijfsgeheugen maakt van de buitenwereld en interne bedrijfsbronnen één evidence-first beslisketen:

`bron → bewijs → signaal → bedrijfsspecifieke impact → aanbeveling → bestaande actie-authority → geverifieerd outcome → learning`.

Het systeem is geen nieuwsfeed. Een extern feit wordt pas bedrijfsimpact wanneer aantoonbare tenant/company-context bestaat.

## Dekking

De taxonomie bevat 45 domeinen: 35 externe omgevingsdomeinen en 10 interne bedrijfsdomeinen. De source catalog bevat officiële, statistische, markt-, research-, community/provider- en interne connectorbronnen.

Een source-catalogrecord betekent mogelijkheid en classificatie. Het betekent niet automatisch dat een bron gekoppeld, waargenomen of live is.

Bronstatus is expliciet:
- `CATALOGUED`: bron/capability bekend;
- `AVAILABLE`: publiek beschikbaar, nog geen actuele observation vereist;
- `CONNECTED`: provider/connectorverbinding aantoonbaar;
- `OBSERVED`: bewijs is opgehaald;
- `LIVE`: recente evidence binnen de freshness-window;
- `STALE`: observation bestaat maar is te oud;
- `ERROR`: provider-/bronfout aantoonbaar.

## Bestaande authorities die worden hergebruikt

- `bg_signaal_onderwerpen` en `bg_externe_signalen`: bestaande externe intelligence-ingang.
- `powerhouse_evidence_source_observations` en `powerhouse_source_observation_v1`: raw evidence.
- bestaande Company Graph: bedrijfsspecifieke context.
- `brain_obligations`: canonical action authority.
- `powerhouse_outcome_memory_v1`: verified business outcomes.
- bestaande daily compound learning: learning authority.
- `powerhouse_runtime_scheduler_mux_v3`: scheduler authority.

Er wordt geen tweede crawler store, scheduler, task engine, outcome memory of learning store gemaakt.

## Nieuwe projections

- `powerhouse_intelligence_domain_registry_v1`
- `powerhouse_intelligence_source_catalog_v1`
- `powerhouse_intelligence_signal_projection_v1`
- `powerhouse_intelligence_company_impact_v1`
- `powerhouse_intelligence_action_candidate_v1`
- `powerhouse_intelligence_snapshot_v1`

De externe signal projection is canonical/global. Tenant-impact staat uitsluitend in de company-impact projection en verwijst naar de canonical signal key.

## Interne evidence-signalen

Interne systemen en connectors worden niet als live beschouwd omdat ze in de catalogus staan. Zodra een echte canonical evidence-observation bestaat, kan `powerhouse_project_internal_evidence_signal_v1(...)` daar een tenant-signaal van maken. De projection bewaart alleen de evidence-referentie en afgeleide signaalmetadata; de ruwe evidence-payload wordt niet naar het Portal-readmodel gekopieerd.

## Verbanden tussen signalen

`powerhouse_intelligence_signal_relation_v1` legt evidence-bounded relaties vast.

Automatisch toegestaan:
- `SHARED_DOMAIN`: zelfde intelligence-domein binnen een begrensde tijdsperiode;
- `COMPANY_DEPENDENCY`: meerdere gescoorde signalen raken aantoonbaar dezelfde tenant-afhankelijkheid.

Niet automatisch toegestaan:
- `CAUSAL_HYPOTHESIS`.

Tijdelijke samenloop, correlatie of hetzelfde onderwerp is geen bewijs dat het ene signaal het andere veroorzaakt. Causaliteit vraagt expliciete evidence.

## Impactmodel

De generieke signaalscore gebruikt bron- en observatie-evidence: relevantie, brontrouw, bevestiging, versheid en confidence.

De bedrijfsspecifieke impactscore wordt alleen berekend wanneer minimaal waarschijnlijkheid, omvang en exposure zijn aangeleverd. Relevantie, urgentie en source confidence verfijnen de score. Ontbrekende kerncontext retourneert `NULL`.

Eurobedragen worden nooit afgeleid uit sectorbenchmarks of modelgissingen zonder tenantbewijs. Kans- en risicowaarde blijven `NULL` totdat evidence ze ondersteunt.

## Actie en outcome

Een tenant-impact kan een action candidate maken. Alleen `READY` + `SCORED` mag een bestaande Brain obligation materialiseren.

Een `FULFILLED` obligation betekent uitsluitend dat de verplichting is afgehandeld. De intelligence-action wordt pas `DONE` wanneer een verified record in `powerhouse_outcome_memory_v1` aan de action/obligation kan worden gekoppeld.

Daarna kan het bestaande daily compound-learning proces het geverifieerde outcome gebruiken. De intelligence capability schrijft geen parallel learning record.

## Portal

Portal V2 bevat **Actueel & externe data → Omgevingsradar** plus de werkviews **Wat raakt mijn bedrijf?**, **Kansen**, **Risico’s**, **Acties & beslissingen**, **Verbanden** en **Sinds gisteren**.

De serverprojectie bestaat uit:
- canonical external signals;
- alleen company impact met de authenticated tenant-id;
- tenant action candidates plus generic review candidates waar nog geen tenantactie bestaat;
- source availability/freshness;
- bekende euro-impact uitsluitend uit tenant impact records.

De gebruiker ziet dus nooit globale of gesynthetiseerde impact alsof die van zijn bedrijf is.

## Scheduling en assurance

Er is geen nieuwe cronjob. De bestaande runtime scheduler mux start de canonical intelligence-refresh op zijn bestaande runtime.

Loop Assurance key: `external-intelligence-universe`.

Verplichte stages:
`input → decision → action → readback → outcome → measurement → learning → guard`.

Geen enkele refresh mag downstream outcome/learning impliceren. De loop blijft terecht AMBER wanneer die evidence ontbreekt.

## Security

Alle nieuwe public-schema projections:
- RLS enabled;
- browserrollen expliciet revoked;
- service-role expliciet granted;
- SECURITY DEFINER functies niet publiek uitvoerbaar;
- tenantdata alleen via de authenticated server function.

## Productie-eindbewijs

Source/CI/merge alleen is niet LIVE_PROVEN. Vereist zijn provider/database readback, exact-main Netlify production readback en functionele Portal/API readback.
