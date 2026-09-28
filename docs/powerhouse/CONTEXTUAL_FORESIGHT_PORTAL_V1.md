# Contextual Foresight Portal v1

Foresight is now rendered where a business decision is made instead of being isolated on a standalone intelligence screen.

## Contextual placements

- Executive overview: top evidence-backed goal forecasts.
- Bedrijfssituatie, Cijfers en Branche/markt: current → expected → uncertainty band → target.
- Businesscase, Waarde/financiering, Due diligence and Exit: evidence-backed forecast plus what-if scenario.
- Roadmap and Actieve acties: risk/off-track context plus next-best actions.
- Outcomes, Learning, Brain, Trust Center and Powerhouse Control Center: prediction-quality evidence.

## Visual truth rules

The portal never invents a forecast. A forecast requires observed company history. If the evidence threshold is not met, the visual explicitly says that there is insufficient history. Scenario effects remain labelled as assumptions until calibrated by observed outcomes.

The portal reuses two canonical authorities:
1. tenant-scoped business-context goal forecasts and scenarios from the existing Brain context engine;
2. aggregate prediction-quality control from `public.powerhouse_prediction_intelligence_control_v2`.

The visual layer does not introduce a second predictive model or forecast store.

## Components

- `portal-v2/foresight-context-ui.js`
- `portal-v2/foresight-context.css`
- `netlify/functions/portal-prediction-intelligence.mjs`
- `portal-v2/tests/foresight-context-ui.test.mjs`


## Production proof

Status: **LIVE_PROVEN_RUNTIME**.

The contextual foresight merge is present in the live production ancestry. Netlify production deploy `602973dace20523c20f0b656713243c5c6408f72` is ready and includes the contextual foresight merge. GitHub production verification completed successfully for both **Production Release Readback** and **Portal V2 Production DOM Readback**. The live deployment also exposes the authenticated `portal-prediction-intelligence` function.

This proves the visual projection is not only present in source: it is part of the deployed Portal V2 runtime. Future changes that remove the contextual placements, uncertainty/evidence labels, scenario distinction, or prediction-quality surface are regressions against this contract.


## Compound intelligence / self-improvement projection

Portal V2 makes the compounding learning loop visible in the same contextual foresight layer. Overview and prediction-quality surfaces show canonical self-improvement state, verified outcomes, learning-company count, measured candidate coverage, compiler readiness, evidence/regression debt, model-health/guardrail issues and the complete Observe → Learn loop.

Source: `public.powerhouse_self_improvement_control_v1`, read through the authenticated `portal-prediction-intelligence` endpoint. No second learning store is introduced and improvement is never inferred from code volume or model novelty.
