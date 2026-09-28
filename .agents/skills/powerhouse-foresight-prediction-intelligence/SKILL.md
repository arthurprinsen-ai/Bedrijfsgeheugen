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
