# Trigger-based MKB acquisition runtime v1

Datum: 2026-09-24
Fingerprint: `powerhouse-trigger-based-acquisition-runtime-v1`

## Runtime
Nieuwe of gewijzigde `powerhouse_predictive_signals` worden event-driven beoordeeld. Alleen bedrijfsspecifieke signals met:
- bekende company identity;
- concrete evidence reference;
- maximaal 90 dagen oud;
- strength >= 0,55;

kunnen een canonieke `powerhouse_opportunities`-row openen.

Markt-signalen blijven fail-closed buiten account-opportunities.

## Truth boundary
De trigger is observed evidence. `problem_hypothesis`, economische impact en relevante beslisser blijven hypothesen totdat enrichment of klantevidence ze bevestigt.

Nieuwe trigger-opportunities starten met:
- stage `signal`;
- expected value = €0;
- expected revenue value = €0;
- next best action = `research_enrichment`;
- channel = `internal_research`.

Direct outbound wordt door deze runtime nooit aangemaakt.

## Canonieke hergebruikte authorities
- `powerhouse_predictive_signals`
- `powerhouse_opportunities`
- `powerhouse_buying_committee_v1`
- `powerhouse_sales_actions`
- sales-action decision-cycle materializer
- `powerhouse_runtime_events`

Geen extra CRM, scheduler of action queue.

## Readback
`powerhouse_trigger_acquisition_readiness_v1` toont:
- vastgehouden markt-signalen;
- bedrijfsspecifieke signals;
- open trigger-opportunities;
- open enrichment-actions;
- unsafe outbound actions (moet 0 blijven).
