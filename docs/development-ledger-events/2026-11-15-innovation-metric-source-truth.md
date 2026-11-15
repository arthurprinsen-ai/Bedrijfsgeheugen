# Development ledger — originele agentinnovatie: meetwaarden niet vals groen

- Datum: 2026-11-15
- Parent-P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Oorspronkelijke kandidaat: `2c1ecc77-58aa-4f25-ae68-e2337853fdc7`
- Oorspronkelijke operatie: `56e16919-6275-4c2e-9208-6ac0c8a29a29`
- Originele bronrevisie: `2026-10-29T13:19:24.643686+00:00`
- Bron-SHA256: `f99e9bd94b52b57e6f1af0b0caa0effeef2d0f7510a6b1e914fb21002b57edad`
- Agent: `agent:agent-integration-engineer`
- Uitvoeringsrun: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43754864334
- Code-PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5908
- Implementatie: voorkom numerieke coercie van whitespace, booleans en arrays naar geobserveerde nul; behoud echte numerieke nul
- Betrokken bronbestand: `platform/portal/powerhouse-existing-integration-read-model.mjs`
- Regressietest: `tests/brain-innovation-metric-source-truth-20261115.test.mjs`
- Learning: `brain/learning/2026-11-15-innovation-metric-source-truth-v1.json`

## Fouten tijdens levering, oorzaak en herstel
1. De agent zette aanvankelijk alleen `evaluation.historical_replay` in het leerrecord. Required/Canonicalization stopte terecht op `LEARNING_EVALUATION_TESTS_REQUIRED:canary`. De ontbrekende `evaluation.canary` is toegevoegd met een echte bestaande regressietest; de test is canary-*testmodus*, geen productieclaim.
2. Required blokkeerde vervolgens op `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger,human_documentation`. Dit ontwikkellog en de menselijke wijzigingsbeschrijving zijn toegevoegd aan dezelfde originele PR. De oorspronkelijke codewijziging is niet verdubbeld en er is geen parallelle executor aangemaakt.

## Beveiliging, volgende verificatie en preventie
De bestaande Required/CodeQL en branch protection moeten slagen vóór automatische merge. Daarna zijn exact gepubliceerde Netlify-commit, producer/consumer-readback en daadwerkelijke brongetrouwe runtime-metingen nodig. Status blijft `PLANNED` / `OPEN` en `terminal_success=false` tot onafhankelijk bewijs bestaat.

Preventieregel voor bestaande agent en skill: leid verplichte historical/shadow/canary-modi af van `compileLearningEvaluationPlan` en eis vóór PR-creatie ook `docs/changes/...` én `docs/development-ledger-events/...` op dezelfde origin lineage. Bij falen: oorzaak en bewijs vastleggen, geen vals groen.
