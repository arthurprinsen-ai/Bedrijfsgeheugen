# Trigger-based MKB acquisition runtime projection v1

Fingerprint: `powerhouse-trigger-based-mkb-acquisition-runtime-v1`
Datum: 2026-09-24

## Doel
Projecteer de reeds canonieke trigger-based acquisitieregel in de bestaande opportunity-runtime, zonder nieuwe CRM-store of parallelle commerciële authority.

## Runtime
`scripts/opportunity/opportunity-scout.mjs` exposeert nu `commercialContext()` en projecteert voor `commercial_acquisition=true`:
- trigger_type
- problem_hypothesis
- economic_impact_hypothesis
- decision_maker_role
- buyer_stage
- recommended_next_action
- recommended_content_angle
- partner_route
- observed_at
- evidence_refs
- commercial_ready
- commercial_execution_class
- do_not_contact_reason

## Fail-closed
`commercial_execution_class=trigger-led-next-action` ontstaat alleen wanneer:
- trigger_type aanwezig is;
- problem_hypothesis aanwezig is;
- decision_maker_role aanwezig is;
- recommended_next_action aanwezig is;
- minimaal één evidence_ref aanwezig is;
- confidence >= 0.6.

Anders blijft de opportunity op `observe` en wordt de ontbrekende context vastgelegd in `do_not_contact_reason`.

## Niet doen
Geen beslisser, trigger, partnerroute of volgende actie afleiden wanneer de input die niet expliciet bevat. Geen bulk outreach als fallback.

## Compatibiliteit
De bestaande opportunity-score, security-prioriteit en generieke qualification blijven behouden. De commerciële projectie is optioneel en wordt alleen geactiveerd door `commercial_acquisition=true`.

## Productie-materialisatie
De runtime wordt ook in Supabase geprojecteerd via migration `20260924131500_trigger_based_mkb_acquisition_runtime_v1.sql`.

Nieuwe authority:
- `powerhouse_mkb_trigger_intelligence_v1`: service-role-only triggerprojectie uit expliciete company-trigger evidence en company-scoped predictive signals;
- `powerhouse_refresh_trigger_based_mkb_acquisition_v1(date)`: upsert naar bestaande opportunities en forecasts en uitsluitend interne research-actions;
- `powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)`: wrapper die daarna de bestaande `powerhouse_commercial_learning_cycle_v1` uitvoert;
- bestaande cron `powerhouse-commercial-learning-v1` wordt via `cron.alter_job` hergebruikt. Er komt geen tweede scheduler.

### Truth boundary
Een LinkedIn-connectie of relatieactivatie op zichzelf is geen kooptrigger. Automatische classificatie vereist expliciet trigger/headline/summary-bewijs of een company-scoped predictive signal. Expected/revenue value blijft 0 totdat echte commerciële waarde-evidence bestaat. Een trigger mag automatisch alleen een interne `research_enrichment`-actie creëren; externe outreach blijft fail-closed onder de bestaande identity, destination, contact-pressure en provider gates.

## Productiebewijs — 24 september 2026
Status: **LIVE_BEWEZEN**.

Readback:
- view `powerhouse_mkb_trigger_intelligence_v1` bestaat in productie;
- functies `powerhouse_refresh_trigger_based_mkb_acquisition_v1(date)` en `powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)` bestaan;
- cron `powerhouse-commercial-learning-v1` is actief op `27 * * * *` en roept de trigger-wrapper aan;
- laatste cycle: `actioned`, `external_outreach_executed=false`;
- anon/authenticated hebben geen SELECT/EXECUTE; alleen service_role.

Rollback-safe production canary: trigger `growth`, confidence 0.884, 1 opportunity op `signal`, 1 interne `research_enrichment`-actie, expected value 0, expected revenue 0, forecast revenue potential 0, external side effect false. Na rollback bleven 0 synthetische signalen/opportunities/actions/forecasts achter.

Huidige echte company-trigger kandidaten: 0. Dat is een geldige lege productiestand; de runtime wacht evidence-first op echte company-trigger evidence.
