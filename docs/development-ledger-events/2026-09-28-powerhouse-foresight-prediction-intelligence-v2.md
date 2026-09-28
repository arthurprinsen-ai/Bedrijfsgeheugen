# Development ledger — Foresight & Prediction Intelligence v2

Date: 2026-09-28
Obligation: BG-20260928-FORESIGHT-PREDICTION-V2

## Change
Extended the existing canonical predictive engine with measurable forecast quality, resolution debt, horizon/method calibration, scenario ensembles and evidence-driven prediction improvement.

## Existing state reused
- public.powerhouse_predictive_signals
- public.powerhouse_forecasts
- public.powerhouse_forecast_calibration
- powerhouse-predictive-engine
- powerhouse-forecast-calibrator

No parallel forecast store or parallel scheduler family was introduced.

## New control surfaces
- public.powerhouse_forecast_quality_v2
- public.powerhouse_forecast_resolution_debt_v2
- public.powerhouse_prediction_intelligence_control_v2
- public.powerhouse_prediction_improvement_queue_v2
- public.powerhouse_prediction_learning_audit_v2()

## Baseline
Observed before implementation: 143 signals, 1,177 forecasts, 3 resolved calibrations, mean Brier component about 0.1092 and mean absolute timing error about 8.9 days. The low resolution count is treated as learning debt rather than as evidence of strong predictive performance.

## Promotion invariant
Forecast-model or method changes require resolved outcomes and backtest → shadow → canary → promote/rollback. Direct autonomous production self-rewrite remains forbidden.
