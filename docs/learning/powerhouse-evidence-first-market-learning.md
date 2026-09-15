# Powerhouse Evidence-First Market Learning

**Contract-ID:** `powerhouse-evidence-first-calibration-gate-v1`  
**Status:** production-enforced  
**Authority:** Bedrijfsgeheugen Powerhouse / Growth & Revenue Operating System  
**Effective:** 2026-09-15

## Doel
Powerhouse mag niet slimmer lijken door meer records, meer calibrations of hogere zelfberekende confidence. Learning en calibration mogen pas de volgende actie beïnvloeden wanneer echte marktwaarnemingen aantonen dat de nieuwe beslisregel beter presteert dan een vooraf vastgelegde holdout/baseline.

## Niet-onderhandelbare invarianten
1. **Prospective assignment first.** Een experimentassignment wordt vóór treatment vastgelegd. Retrospectieve assignment is geen causaal bewijs.
2. **Treatment + holdout.** Calibration-promotion vereist beide armen en een verstreken measurement horizon. Geen positieve outcome na de horizon is geldige negatieve marktwaarheid, geen ontbrekende data.
3. **Observed execution economics only.** Werkelijke providerkosten, externe kosten en/of menselijke minuten worden opgeslagen in `powerhouse_action_economics` met evidence. Ontbrekende waarden blijven NULL.
4. **Human decisions are first-class evidence.** `edit`, `skip`, `override`, `alternative_action`, `cancel` en `approve` worden via `powerhouse_human_feedback_events` vastgelegd wanneer ze werkelijk plaatsvinden.
5. **Full downstream lineage.** Echte outcomes blijven gekoppeld aan actie/opportunity: reply/response → meeting/afspraak → proposal/offerte → win/order of loss → gerealiseerde omzet.
6. **Observation volume is not confidence.** Aantallen calibrations, outcomes, posts of acties verhogen nooit op zichzelf een learning-confidence.
7. **Calibration is fail-closed.** Alleen een prospectief experiment met `eligibility_snapshot.experiment_class = "calibration_policy"`, causale readiness, complete observed economics en betere gerealiseerde omzet per matured assignment dan de holdout mag `calibration_may_influence_next_actions=true` opleveren.
8. **No synthetic backfill.** Ontbrekende assignments, economics, human feedback of outcomes worden niet fictief aangevuld.
9. **Negative evidence stays.** Losses, no-response en tegenbewijs blijven bewaard.
10. **Production readback decides status.** Agenttekst of migration-success alleen is nooit bewijs.

## Canonieke componenten
- `powerhouse_experiment_assignments`: pre-treatment assignment authority.
- `powerhouse_action_economics`: werkelijke uitvoeringskosten en human effort.
- `powerhouse_human_feedback_events`: menselijke edits/skips/overrides en andere beslissingen.
- `powerhouse_sales_actions`: uitgevoerde commerciële acties.
- `powerhouse_sales_outcomes`: downstream marktuitkomsten en omzet.
- `powerhouse_causal_experiment_readiness_v1`: prospectieve treatment/holdout readiness; readiness is nog geen uplift-proof.
- `powerhouse_market_evidence_maturity_v1`: production readback voor assignments, economics, human interventions, funnel-outcomes en omzet.
- `powerhouse_calibration_actionability_v1`: harde promotion-gate voor calibration → next action.
- `powerhouse_guard_self_improvement_learning_v1()`: voorkomt aggregate-count confidence als actieve self-improvement learning.
- `powerhouse_market_truth_daily_v1`: bestaande market-truth writeback; geen parallel learning-systeem.

## Promotion contract
De evidence-state loopt conceptueel:

`collecting_evidence → collecting_both_arms → collecting_execution_economics → collecting_matured_market_evidence → ready_for_effect_estimation`

`ready_for_effect_estimation` betekent alleen dat effectschatting verantwoord kan beginnen. Het is niet hetzelfde als bewezen verbetering.

Voor calibration-actionability geldt daarna:

`prospective calibration_policy experiment + complete economics + matured treatment/holdout + observed revenue per matured assignment > holdout → calibration_may_influence_next_actions`

Zonder die keten blijft Powerhouse observeren, meten en hypotheses vormen.

## Self-improvement hardening
De bestaande learning `autonomous-growth-revenue-self-improvement-v1` gebruikte eerder een confidence-formule die opliep met het aantal calibrations/outcomes. Dat is op 2026-09-15 ongeldig verklaard als bewijs van verbetering.

De database-trigger forceert deze learning naar `status='hypothesis'` en `confidence=0` zolang geen echte calibration-policy proof bestaat én de learning niet expliciet `confidence_source='observed_calibration_policy_proof'` draagt.

## Production readback bij invoering
- assignments: 0
- treatment assignments: 0
- holdout assignments: 0
- observed action economics: 0
- human edits/skips/overrides: 0
- downstream observed outcomes: 1 reply
- meetings/proposals/wins/losses: 0
- realized revenue: EUR 0
- causal-ready experiments: 0
- evidence status: `collecting_evidence`
- autonomous self-improvement learning: `hypothesis`, confidence `0`, gate `blocked`

Deze sparse toestand is correct en wordt niet cosmetisch aangevuld.

## Required write path vanaf nu
1. Hypothese, subject/opportunity, horizon en baseline/holdout vooraf vastleggen.
2. Assignment vóór treatment schrijven via de bestaande assignment authority.
3. Alleen treatment-actions aan treatment-assignments koppelen; holdout krijgt geen treatment-action.
4. Na echte uitvoering kosten/tijd met bronbewijs registreren.
5. Menselijke edit/skip/override registreren zodra die werkelijk plaatsvindt.
6. Replies, meetings, proposals, wins/losses en omzet op de bestaande sales-outcome lineage registreren.
7. Horizon laten uitlopen en causale readiness teruglezen.
8. Effect schatten; next-action policy niet wijzigen zolang actionability false is.
9. Outcome, calibration en learning met volledige provenance terugschrijven.
10. Bij tegenbewijs hold/demote/retire in plaats van confidence verhogen.

## Regressieregels
Een wijziging is defect als zij een van deze situaties mogelijk maakt:
- `active/proven` self-improvement op basis van alleen counts;
- calibration die next-action ranking beïnvloedt zonder prospectieve calibration-policy proof;
- economics zonder werkelijk uitgevoerde actie;
- treatmentassignment na treatment;
- synthetische human feedback of omzet;
- verlies van holdout/negative/no-response evidence;
- lege evidence-state die ten onrechte als groen/ready verschijnt.

De empty-state regressie is expliciet getest: `powerhouse_market_evidence_maturity_v1` moet ook bij 0 assignments exact één statusrij teruggeven met `evidence_status='collecting_evidence'`.
