---
name: powerhouse-foresight-prediction-intelligence
description: Use for Powerhouse future prediction, foresight, forecast quality, calibration, scenario ensembles, leading indicators, forecast resolution, signal diversity and autonomous prediction improvement.
---

# Powerhouse Foresight & Prediction Intelligence

Fingerprint: `powerhouse|foresight|prediction-calibration-resolution-compounding|v2`.

## North Star

Powerhouse must become measurably better at anticipating future company, customer, market, technology, regulation and operational outcomes every day.

## Canonical prediction loop

`Signals → Leading indicators → Forecast → Scenarios → Action → Outcome → Resolution → Calibration → Challenger → Better forecast`

## Required quality metrics

- Brier score.
- Calibration error.
- Timing MAE.
- Forecast resolution coverage.
- Independent signal-source diversity.
- Horizon-specific quality.
- Scope/method-specific quality.

## Hard rules

- Prediction is never fact.
- Unresolved due forecasts are explicit learning debt.
- Forecast changes require resolved-outcome evidence.
- Material forecasts use scenario ensembles, not one brittle point estimate.
- Probability mappings and horizon estimators may self-improve only through backtest → shadow → canary → promote/rollback.
- No direct autonomous production self-rewrite.
- Revenue or business value is never invented from predictive probability alone.
- Sensitive-person inference remains forbidden.
- Existing `powerhouse_forecasts`, `powerhouse_predictive_signals` and `powerhouse_forecast_calibration` remain canonical; no parallel forecast store.

## Runtime authorities

- `public.powerhouse_forecast_quality_v2`
- `public.powerhouse_forecast_resolution_debt_v2`
- `public.powerhouse_prediction_intelligence_control_v2`
- `public.powerhouse_prediction_improvement_queue_v2`
- `public.powerhouse_prediction_learning_audit_v2()`
- `scripts/brain/foresight-autonomy.mjs`
- `config/powerhouse-foresight-autonomy.json`

## Self-improvement bridge

Prediction quality is an explicit Self-Improvement objective. Degradation produces bounded challenger hypotheses; only evidence-backed winners may be promoted through existing protected delivery.

## Terminal production proof

This capability is LIVE_PROVEN_RUNTIME. Production readback on 2026-09-28 verified 1,177 forecasts, 3 resolved outcomes, zero resolution debt for currently due forecasts, Brier score 0.1092, calibration error 0.3297, timing MAE 8.9 days, 143 predictive signals and 3 independent source types. The current state is intentionally CALIBRATION_DEGRADED, which creates bounded improvement work rather than falsely reporting prediction quality as green. The prediction learning audit runs daily at 06:35 and reuses the existing predictive engine and forecast calibrator.


## Portal visibility contract

Foresight is not a detached dashboard. It must be projected contextually wherever it changes a decision.

Required customer-facing placements:
- Executive overview: "Wat zien we aankomen?" with the top evidence-backed goal forecasts.
- Bedrijfssituatie, Cijfers en Branche/markt: current → expected → uncertainty band → target.
- Businesscase, Waarde/financiering, Due diligence and Exit: forecast plus scenario/what-if impact.
- Roadmap and Actieve acties: at-risk/off-track forecasts and the corresponding next-best actions.
- Outcomes, Learning, Brain and Trust Center: forecast-quality evidence including Brier score, calibration error, timing MAE, resolution coverage and signal diversity.

Visual rules:
- Never fabricate a forecast when there are fewer than the required observed history points.
- Always distinguish forecast from what-if scenario.
- Always show uncertainty and evidence state.
- Prediction-quality metrics are operational evidence, not customer-specific predictions.
- Contextual projection must reuse the canonical business-context goal forecasts/scenarios and the canonical prediction-control view; no second forecasting model in the portal.


## Contextual portal production proof

The contextual foresight projection is LIVE_PROVEN_RUNTIME. Portal V2 production deploy `602973dace20523c20f0b656713243c5c6408f72` is a descendant of the contextual-foresight merge and production readback passed both **Production Release Readback** and **Portal V2 Production DOM Readback**. The authenticated `portal-prediction-intelligence` function is present in the live Netlify deployment. Required placements and truth rules in the Portal visibility contract are therefore production obligations, not optional presentation guidance.


## Compound intelligence visibility contract

The contextual foresight surface must also show whether Powerhouse itself is improving. On Overview and the prediction-quality surfaces, render the canonical self-improvement control state from `public.powerhouse_self_improvement_control_v1` alongside prediction quality.

Required visual evidence:
- current self-improvement state;
- verified outcomes and number of learning companies;
- measured versus total optimization candidates;
- compiler-ready items and evidence/regression debt;
- model-health/guardrail issues;
- the explicit `observe → detect → hypothesize → build → test → evaluate → compare → promote → measure → learn` loop.

This projection is evidence-only. It must never claim that Powerhouse became smarter merely because code changed or a model was added.

## Automatic evidence-backed resolution

Forecast resolution consumes the existing canonical Outcome Memory through `public.powerhouse_forecast_resolution_candidates_v3` and `public.powerhouse_resolve_forecasts_from_outcomes_v3()`.

Rules:
- eligible commercial-progression forecasts may resolve positively from a matching verified outcome inside their horizon;
- a missing outcome is never auto-resolved as failure;
- no parallel forecast or calibration store is allowed;
- forecast-resolution coverage is part of the daily compound-learning control plane;
- resolved outcomes feed calibration and the next prediction-learning cycle automatically.


## Daily Compound Learning inheritance

Fingerprint: `powerhouse|daily-compound-learning|all-nodes-inherit|v1`.

This skill inherits the canonical daily compound-learning contract. Every material chat/agent execution must:
- consume bounded shared context and existing learning before acting;
- preserve one canonical outcome/forecast/learning lineage;
- treat only verified observed evidence as outcome truth;
- never convert silence, transport success, synthetic/test events or forecasts into realized outcomes;
- feed verified outcomes into Company Intelligence, Forecast Calibration and Self-Improvement;
- write material learning/prevention back so the next chat or agent changes its next decision;
- remain discoverable through System Map and canonical skill projection.

Canonical runtime: `public.powerhouse_run_daily_compound_learning_v1(date)`.
