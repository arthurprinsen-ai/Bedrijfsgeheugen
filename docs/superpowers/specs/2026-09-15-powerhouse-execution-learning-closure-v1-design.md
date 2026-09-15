# Powerhouse Execution & Learning Closure v1

## Goal
Close the remaining evidence-backed Powerhouse gaps without inventing business truth: experiments must move from planned to active/decided only on production evidence, mature forecasts must be calibrated, opportunities must receive explicitly modeled economics from existing forecast/offer evidence, runtime orchestration must serialize safely, and all results must feed the existing learning lineage.

## Existing-state-first
Reuse only the canonical stores and engines: `social_experiments`, `social_posts`, `social_metric_snapshots`, `bg_post_kenmerken`, `powerhouse_forecasts`, `powerhouse_forecast_calibration`, `powerhouse_opportunities`, `powerhouse_sales_actions`, `powerhouse_sales_outcomes`, `powerhouse_runtime_events`, `powerhouse_sales_learnings`, `powerhouse-forecast-calibrator`, `bg-experimentcyclus`, and `powerhouse_commercial_closed_loop_v2`. No parallel CRM, analytics, experiment, valuation or learning store.

## Rules
1. Experiment execution is evidence-driven. A PLANNED experiment becomes ACTIVE only when at least one published linked post exists. A winner/decision is never fabricated; decision requires the configured minimum sample, elapsed decision horizon, and measured social/commercial evidence.
2. Forecast calibration is truth-preserving. Only forecasts whose horizon has matured are eligible; the existing calibrator remains authoritative.
3. Opportunity economics may use forecast-modeled value (`revenue_potential * probability * confidence`, confidence-discounted and matched by company/topic) but must never overwrite `expected_value_eur` or be called realized revenue.
4. Runtime deadlocks are prevented by a transaction-scoped advisory lock around the closure orchestrator; concurrent invocations return an explicit skipped/concurrent result rather than competing writes.
5. The closure writes canonical runtime evidence and learning every run and is scheduled hourly after the existing commercial-learning cycle.
6. Unknown external outcomes remain pending with explicit obligations; no response/conversion/revenue is synthesized.

## Done
Production is complete only after exact-head gates are green, migration is applied, scheduler is active, a production run is read back, experiment/forecast/opportunity counts are re-read, and the learning fingerprint is present.