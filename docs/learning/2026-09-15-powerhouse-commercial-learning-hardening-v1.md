# Powerhouse Commercial Learning Hardening v1

Date: 2026-09-15
Status: production migration applied; GitHub release pending final green CI + merge at authoring time

## Purpose

This release closes the remaining commercial-learning gaps on top of the existing Powerhouse Revenue Intelligence Loop. It does not introduce a second CRM, second learning store, second action queue or Make dependency.

Canonical lineage remains:

`signal/evidence -> person/company/opportunity -> prediction -> next-best-action -> observed outcome -> calibration -> learning -> revised action`

The hardening layer adds economic, causal, operational and governance context around that lineage.

## New canonical derived surfaces

- `powerhouse_counterfactual_candidate_v1`: stable prospective holdout/treatment candidates. A candidate is explicitly `causal_status=not_proven`; valid causal inference requires persisted assignment before treatment and a matured outcome window.
- `powerhouse_unit_economics_v1`: observed execution cost/human-minutes versus realized revenue. Missing cost data remains `insufficient_evidence`.
- `powerhouse_customer_expansion_v1`: expansion candidates derived only from companies with observed positive realized revenue plus open pipeline.
- `powerhouse_lost_deal_intelligence_v1`: observed lost/rejected/declined/no-fit/not-interested outcomes grouped by reason and channel.
- `powerhouse_competitor_intelligence_v1`: competitor mentions only when explicitly observed in runtime/outcome evidence.
- `powerhouse_provider_health_v1`: provider/source health from runtime errors plus canonical source freshness.
- `powerhouse_human_feedback_learning_v1`: skipped/cancelled recommendations become explicit human-feedback evidence instead of disappearing.
- `powerhouse_revenue_truth_v1`: strictly separates forecast revenue, attributed revenue and realized revenue.
- `powerhouse_decision_explainability_v1`: exposes why-now, account thesis, prediction inputs, evidence density, missing evidence and blocking state for each command-center recommendation.
- `powerhouse_contact_permission_guard_v1`: blocks known opt-out/do-not-contact evidence. Absence of an observed opt-out is explicitly not legal-consent proof.
- `powerhouse_capacity_guard_v1`: reuses the canonical maximum of five direct automated LinkedIn/email outbound actions per Europe/Amsterdam day and holds when required data sources are stale/missing.
- `powerhouse_north_star_v1`: one commercial truth surface for open pipeline, meetings, proposals, wins, realized revenue, calibration sample size and human-feedback sample size.

## Existing capabilities deliberately reused

- `powerhouse_offer_pricing_learning_v1` remains the canonical offer/pricing evidence surface; this release does not duplicate it.
- `powerhouse_source_freshness_v1` remains canonical for source freshness and is consumed by provider/capacity health.
- `powerhouse_revenue_command_center_snapshot_v1` remains the bounded command-center source and is reused for explainability.
- Existing sales actions/outcomes/opportunities/forecasts/runtime events remain the transactional truth.

## Counterfactual truth boundary

The new holdout surface is a prospective candidate generator, not a historical causal proof engine. Stable hashing creates reproducible candidate arms, but Powerhouse may only claim causal lift after assignment is persisted before treatment, treatment/control eligibility remains comparable, the measurement horizon has matured, and the observed outcome sample is sufficient.

Until then Powerhouse may say `candidate_holdout`, never `caused X% uplift`.

## Economic truth boundary

Three revenue concepts are kept separate:

1. `forecast_revenue_eur` — predicted/expected value;
2. `attributed_revenue_eur` — observed revenue linked to an action/content/campaign lineage;
3. `realized_revenue_eur` — observed `powerhouse_sales_outcomes.revenue_eur` only.

Forecast or attributed revenue must never be presented as realized cash.

## Offer/pricing learning

Pricing intelligence already existed in `powerhouse_offer_pricing_learning_v1`, built from observed offers and wins. This release reuses that authority rather than creating a competing pricing engine. Future pricing recommendations must remain evidence-weighted and sparse-data aware.

## Customer expansion and lost-deal learning

A customer is recognized only from observed positive revenue outcomes. Expansion candidates therefore cannot be created from a mere high score. Lost-deal learning likewise requires an observed loss/rejection outcome and preserves the observed reason rather than inventing one.

## Provider/freshness degradation

Provider state becomes degraded on observed recent runtime errors or canonical stale/missing freshness. It becomes unknown when a provider has not produced recent evidence. This prevents a missing provider from silently being treated as healthy.

## Human feedback

A skipped or cancelled recommended action is commercial evidence. If a human reason is supplied it becomes `explicit_rejection`; otherwise it becomes `implicit_skip`. These signals can later be used to calibrate which recommendations are operationally useful, without pretending every skip is a negative market outcome.

## Consent/compliance boundary

Observed opt-out, unsubscribe, do-not-contact or contact-blocked signals fail closed. `no_observed_optout` does not mean legal permission has been proven. Channel-specific legal basis, platform rules and human-send constraints remain separate mandatory gates.

## Capacity and unit economics

Direct automated outbound remains capped at five LinkedIn-DM/email actions per Europe/Amsterdam day unless a stricter canonical rule applies. The unit-economics surface remains sparse until executed actions carry observed `cost_eur` and/or `human_minutes`; missing costs are not replaced by assumptions.

## Disaster recovery / rollback

Repository main remains the deployment authority. Rollback means restoring the last verified GitHub main revision and its corresponding Supabase migration state through a new forward migration or approved production promotion path. Never edit production schema ad hoc to mimic an old state, and never delete canonical history to make health appear green.

## Production readback immediately after migration

Observed on 2026-09-15 after applying production migration ledger version `20260915162839`:

- counterfactual candidate rows: 79;
- revenue-truth rows: 80;
- explainability rows: 80;
- contact-permission guard rows: 253;
- provider-health rows: 34;
- capacity-guard rows: 1;
- north-star rows: 1;
- unit-economics rows: 0;
- customer-expansion rows: 0;
- lost-deal rows: 0;
- competitor rows: 0;
- human-feedback rows: 0.

The zero-row surfaces are not implementation failures: they indicate there is currently no observed canonical evidence of those types. This is intentionally preferable to synthesizing economics, competitors, customers, losses or human feedback.

## Prevention rules

- Never infer causal lift from observational before/after data alone.
- Never synthesize realized revenue, price acceptance, competitor presence, lost reason, customer status or cost.
- Never treat no observed opt-out as legal consent proof.
- Never let provider silence count as healthy without freshness/readback evidence.
- Never discard human overrides/skips when an action recommendation was generated.
- Never let direct outbound exceed the canonical daily cap merely to increase activity.
- Never recompute heavy person/company intelligence on interactive read paths; reuse bounded snapshots.
- Keep GitHub migration filename/version exactly aligned with the production Supabase migration ledger.

## Release acceptance

The release is `LIVE & BEWEZEN` only when: production views exist and read back, security contract is green, Revenue Learning is green, Required is green, Unified BRAIN delivery is green, the PR is merged to current main, main readback proves the merge SHA, and Verification/Learning/Memory/CurrentState are written into the existing Powerhouse canonical ledger.
