# Powerhouse Evidence Collector & Experiment Orchestrator v1

**Contract-ID:** `powerhouse-evidence-collector-experiment-orchestrator-v1`  
**Authority:** Bedrijfsgeheugen Powerhouse / Growth & Revenue Operating System  
**Status:** production-enforced  
**Effective:** 2026-09-15

## Doel
Deze laag sluit de lus tussen echte commerciële uitvoering en aantoonbaar betere volgende acties. Zij bouwt geen parallel brein of CRM, maar gebruikt de bestaande canonieke Powerhouse-tabellen voor assignments, sales actions, economics, human feedback, outcomes, learnings en calibration.

## Niet-onderhandelbare regels
1. Assignment vóór treatment. Geen retrospectieve causaliteitsclaim.
2. Holdout krijgt geen treatment-action.
3. Uitvoeringskosten en human effort zijn observed evidence; ontbrekende waarden worden niet verzonnen.
4. Edit, skip, override, approve, cancel en alternative action zijn first-class evidence.
5. Downstream lineage blijft reply/response → meeting → proposal → win/loss → gerealiseerde omzet.
6. No-response na de meet-horizon wordt expliciete negatieve marktwaarheid.
7. Experiment collisions en holdout contamination worden zichtbaar en blokkeren promotion.
8. Een minimum sample floor is verplicht voordat effectbeoordeling kan promoveren.
9. Observed uplift is geen vrijbrief: de bestaande calibration-actionability gate moet óók groen zijn.
10. Alleen `powerhouse_next_action_policy_authority_v1` mag bewezen policy-versies aan de Next Best Action-laag aanbieden.
11. Zonder bewezen policy blijft de authority leeg en gebruikt Powerhouse baseline/default gedrag.
12. Promotion en demotion schrijven terug naar dezelfde bestaande `powerhouse_sales_learnings`; er ontstaat geen parallel learning-systeem.
13. Omzet wordt onderscheiden via attribution metadata (`observed`, `influenced`, `causal`).
14. Elke evidence-write moet provenance bevatten waar de canonical ingestion RPC dat vereist.
15. Security blijft server-only: RLS, browser-role revokes en deterministic `search_path` op SECURITY DEFINER-functies.

## Canonieke componenten
### Bestaand en hergebruikt
- `powerhouse_experiment_assignments`
- `powerhouse_sales_actions`
- `powerhouse_action_economics`
- `powerhouse_human_feedback_events`
- `powerhouse_sales_outcomes`
- `powerhouse_sales_learnings`
- `powerhouse_causal_experiment_readiness_v1`
- `powerhouse_calibration_actionability_v1`
- `powerhouse_market_evidence_maturity_v1`
- `powerhouse_market_truth_daily_v1`

### Nieuwe configuratie en lifecycle
- `powerhouse_experiment_policies`: treatment %, horizon, sample floor, segmentatie, primary metric, guardrails en policy version.
- `powerhouse_policy_versions`: baseline/candidate/promoted/demoted/retired lifecycle met effect- en evidence-snapshot.

### Nieuwe write-contracten
- `powerhouse_prepare_experiment_action_v1`: deterministische prospectieve assignment en treatment/holdout-besluit.
- `powerhouse_attach_treatment_action_v1`: koppelt alleen treatment-action als assignment aantoonbaar eerder bestond.
- `powerhouse_record_action_economics_v1`: accepteert alleen economics voor daadwerkelijk uitgevoerde actions en vereist bronbewijs.
- `powerhouse_record_human_feedback_v1`: schrijft echte menselijke interventies met evidence.
- `powerhouse_record_market_outcome_v1`: schrijft echte downstream outcomes en attribution metadata.
- `powerhouse_close_matured_no_response_v1`: sluit verlopen horizons en schrijft `no_response` als negatieve evidence.

### Nieuwe guards en readbacks
- `powerhouse_guard_experiment_linked_action_v1`: blokkeert experiment-linked treatment zonder prospectieve treatment-assignment en blokkeert holdout-treatment.
- `powerhouse_experiment_collision_contamination_v1`: detecteert gelijktijdige experimenten op hetzelfde subject en holdout-vervuiling.
- `powerhouse_experiment_effect_estimates_v1`: treatment-vs-holdout observed effect met sample-floor.
- `powerhouse_experiment_evidence_health_v1`: overdue horizons, actions zonder economics, contamination, collisions en evidence-gaten.
- `powerhouse_experiment_operating_dashboard_v1`: menselijk leesbare operationele experimentstatus.
- `powerhouse_next_action_policy_authority_v1`: enige promoted policy authority voor Next Best Action.

## Promotion contract
`powerhouse_promote_policy_if_proven_v1` promoveert uitsluitend wanneer alle volgende voorwaarden tegelijk waar zijn:
- minimum matured treatment én holdout sample gehaald;
- bestaande `powerhouse_calibration_actionability_v1` is true;
- observed revenue per matured assignment toont positieve uplift;
- geen collision of holdout contamination;
- policy version is expliciet bekend.

Bij promotion wordt een version-record geschreven en dezelfde bestaande sales-learning lineage aangevuld met `confidence_source = observed_calibration_policy_proof`. Bij tegenbewijs kan `powerhouse_demote_policy_v1` de versie weer uit de NBA-authority halen en de learning retire-ren.

## Automatische maintenance
`powerhouse_evidence_daily_maintenance_v1` draait via pg_cron elk uur op minuut 17. De run is idempotent en doet:
1. expired horizons sluiten;
2. ontbrekende no-response outcomes schrijven;
3. evidence-health uitlezen;
4. bestaande market-truth daily writeback uitvoeren;
5. voor actieve experimentpolicies promotion-gates evalueren.

De frequentie is bewust uur-gebaseerd zodat DST geen gemiste dagelijkse maintenance veroorzaakt. Het is geen claim dat evidence elk uur rijp wordt.

## Productie-readback bij invoering
- open assignments: 0
- overdue horizons: 0
- treatment actions zonder economics: 0
- contaminated holdouts: 0
- collision assignments: 0
- feedback zonder evidence: 0
- revenue zonder evidence: 0
- NBA authority rows: 0
- maintenance cron: actief op `17 * * * *`
- market-truth boundary: `sparse evidence must collect more observed market truth and must not increase autonomy`
- assignment count: 0
- human feedback rows: 0
- realized revenue: EUR 0
- causal-ready experiments: 0

Dit is de correcte fail-closed toestand. Geen actieve experimentpolicy of promoted policy is synthetisch aangemaakt.

## Wat producers voortaan moeten doen
Een executor/provider/cockpit die onder experiment wil handelen moet:
1. eerst `powerhouse_prepare_experiment_action_v1` aanroepen;
2. bij holdout géén treatment uitvoeren;
3. bij treatment de sales action maken met `evidence.experiment_key`;
4. de action koppelen via `powerhouse_attach_treatment_action_v1`;
5. na uitvoering echte kosten/tijd schrijven;
6. elke human edit/skip/override schrijven;
7. echte outcomes blijven koppelen;
8. nooit zelf policy confidence verhogen of een policy als bewezen markeren.

## Nog geen synthetische activatie
Er wordt bewust geen fake experiment, fake treatment, fake holdout of fake omzet geseed om de views te vullen. De eerste echte actieve policy moet gebaseerd zijn op een zakelijke hypothese en een echte populatie. Tot die tijd blijft `powerhouse_next_action_policy_authority_v1` leeg en behoudt Powerhouse baselinegedrag.

## Regressieregels
Defect wanneer een wijziging een van deze situaties mogelijk maakt:
- treatment-action zonder voorafgaande assignment;
- treatment op een holdout;
- economics voor een niet-uitgevoerde action;
- promotion zonder minimum sample floor;
- promotion bij contamination/collision;
- promotion terwijl calibration-actionability false is;
- NBA-consumptie van een niet-promoted policy;
- verdwijnen van no-response/loss evidence;
- synthetische backfill van costs, human feedback, outcomes of revenue;
- browsertoegang tot interne experiment/configuratie-authorities.
