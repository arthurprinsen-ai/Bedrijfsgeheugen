# Powerhouse Foresight & Prediction Intelligence v2

Powerhouse already had predictive signals, forecasts and calibration. The missing compounding loop was forecast-resolution discipline: prediction quality cannot improve reliably when forecasts are created faster than outcomes are resolved.

## Architecture

`Company Graph + external signals + operating outcomes → leading indicators → horizon forecasts → scenario ensembles → actions → observed outcomes → forecast resolution → calibration → challenger models → better forecasts`

The layer does not create a second forecasting datastore. It reuses the existing canonical predictive signals, forecasts and calibration tables.

## Prediction quality

Powerhouse now treats prediction as an engineering discipline, not an AI opinion.

Primary metrics:
- Brier score: probability accuracy.
- Calibration error: whether 70% predictions happen roughly 70% of the time.
- Timing MAE: how far predicted event timing differs from reality.
- Resolution coverage: how many due predictions receive a verified outcome.
- Signal diversity: number of independent signal source types.
- Horizon/method quality: performance by 7d, 30d, 90d, 12m and 36m+ horizon.

## Autonomous learning

When quality degrades, Powerhouse creates an improvement hypothesis such as:
- resolve more due forecasts;
- recalibrate probability mapping;
- retrain horizon/lead-time estimation;
- broaden independent signal sources;
- challenge the current forecasting method.

A hypothesis does not become production truth automatically. Promotion requires historical backtest, shadow/canary evidence, non-regression on probability/timing quality and the existing security/data-quality gates.

## Current baseline at implementation

At implementation readback the canonical store contained 143 predictive signals, 1,177 forecasts and only 3 resolved/calibrated forecasts. The immediate priority is therefore resolution coverage and calibration learning, not producing ever more unverified predictions.
