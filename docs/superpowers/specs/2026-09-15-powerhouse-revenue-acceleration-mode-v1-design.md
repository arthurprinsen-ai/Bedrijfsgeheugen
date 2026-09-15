# Powerhouse Revenue Acceleration Mode v1 — Design

## Goal
Turn the already-live Bedrijfsgeheugen Powerhouse intelligence/learning stack into higher commercial throughput without creating a parallel CRM, queue, scheduler, analytics store, provider layer or learning system.

The system must reuse the existing canonical lineage: `powerhouse_opportunities` → `powerhouse_sales_actions` → provider execution/readback → `powerhouse_sales_outcomes` → forecast/social/revenue calibration → promoted/weakened learnings → next decision.

## Existing-state findings
Production already contains:
- `powerhouse_autonomous_growth_revenue_cycle`
- `powerhouse_autonomous_gap_closer_v1`
- `powerhouse_commercial_learning_cycle_v1`
- `powerhouse_prepare_safe_actions_v1`
- `powerhouse_action_queue`
- `powerhouse_commercial_next_best_action_v2`
- `powerhouse_action_value_rank_v1`
- `powerhouse_revenue_flywheel_v1`
- `powerhouse_sales_strategy_performance_v1`
- `powerhouse_creative_commercial_learning_v1`
- `powerhouse_offer_pricing_learning_v1`
- `powerhouse_experiment_decision_queue_v1`
- canonical predictive forecasts and calibration
- hourly gap closing and commercial-learning crons
- Gmail provider readback evidence in `powerhouse_runtime_events`.

The largest observed execution gap is not missing opportunity generation: there are already dozens of e-mail and LinkedIn actions. The gap is that outbound hard-gate evidence has not been materialized, so `powerhouse_prepare_safe_actions_v1` correctly leaves those actions fail-closed.

## Architecture
### 1. Outbound execution-gate enrichment
Add `powerhouse_enrich_outbound_execution_gates_v1(run_date)`.

For existing suggested e-mail/LinkedIn actions it joins the canonical `powerhouse_commercial_next_best_action_v2` view and writes only observed/derivable gate evidence into `powerhouse_sales_actions.evidence.execution_gate`.

E-mail may be provider-capable only when a recent Gmail `provider_readback_verified` event exists. Exact destination is true only when the intelligence view has a non-empty e-mail address for the same opportunity/person. LinkedIn DM remains provider-capability false unless a verified LinkedIn outbound provider readback exists. No provider capability is inferred from a profile URL alone.

Eligibility requires an open opportunity, a person identity, a positive expected commercial value and sufficient buying-window/action confidence. Contact pressure is false when recent external outreach to the same person exists inside the configured cooling period. Truth verification requires non-empty contextual evidence, not a model-only assertion.

### 2. Evidence-based learning promotion/demotion
Add `powerhouse_promote_commercial_learnings_v1(run_date)`.

It updates existing `revenue_learnings`, `social_learnings` and `powerhouse_sales_learnings`; it creates no new learning store.

Rules are deterministic and fail-closed:
- `PROVEN`: sample >= 5, confidence >= 0.70, baseline present where the table supports a baseline, positive effect/evidence.
- `WEAKENING`: sample >= 5 with confidence < 0.50, non-positive effect, expired validation or contradictory evidence.
- `REJECTED`: sample >= 10 with confidence < 0.35 and non-positive effect.
- otherwise retain/normalize to testing/active state rather than promoting.

Every changed status is written to `powerhouse_runtime_events` as evidence of the promotion/demotion decision.

### 3. Revenue acceleration cycle
Add `powerhouse_revenue_acceleration_cycle_v1(run_date)` as a thin orchestration layer over existing capabilities.

Sequence:
1. Run `powerhouse_commercial_learning_cycle_v1`.
2. Enrich outbound hard gates.
3. Run `powerhouse_prepare_safe_actions_v1`.
4. Run learning promotion/demotion.
5. Read flywheel, maturity, strategy performance, experiment queue and action queue state.
6. Write one fail-closed `revenue_acceleration_cycle` runtime event and a `bg_gezondheid` health row.

The cycle does not send outbound itself. Provider execution remains owned by the existing authorized provider route. The cycle's responsibility is to make genuinely eligible actions executable and make blocked actions explainably fail-closed.

## Throughput and safety policy
- Maximum new automated e-mail/LinkedIn DM preparations per Europe/Amsterdam day remains 5.
- Exact destination, identity, eligibility, truth, contact pressure and provider capability are mandatory before `prepared`.
- Gmail capability uses actual recent provider readback.
- LinkedIn DM stays blocked until an outbound-capable provider/cockpit route writes verified provider evidence.
- Revenue is never inferred. Only `powerhouse_sales_outcomes.revenue_eur` counts as realized revenue.
- No Make dependency.
- No synthetic analytics or fabricated outcomes.

## Scheduling
Reuse the existing cron family by adding one canonical hourly job at minute 32, after commercial learning at minute 27. This is an orchestration entrypoint, not a parallel scheduler family.

## Health / definition of green
`revenue_acceleration_cycle_v1` is healthy only when:
- commercial learning is healthy;
- the canonical full-cycle proof is healthy;
- there are no overdue forecast calibrations;
- eligible e-mail actions are not blocked merely because gate evidence was never materialized;
- all external prepared actions satisfy all six hard gates;
- any remaining LinkedIn DM blocks are explicit provider-capability blocks rather than silent failures.

Commercial success metrics are reported but do not get fabricated thresholds: prepared/executed actions, observed replies/outcomes, meetings/proposals/orders, realized revenue, mature learnings, experiment decisions and forecast calibration quality.

## Learning contract
Every failure, hold, status promotion/demotion and provider limitation is written into the existing Powerhouse runtime/learning lineage. The system must learn from `no response`, blocked execution, successful replies, meetings, proposals, orders and realized revenue once those outcomes are actually observed.