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
