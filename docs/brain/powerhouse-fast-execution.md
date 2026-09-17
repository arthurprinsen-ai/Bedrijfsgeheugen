# Powerhouse Fast Execution v1

## Status
`POWERHOUSE-FAST-EXECUTION-v1` is de default execution-policy voor alle huidige en toekomstige materiële Bedrijfsgeheugen chats, agents, workflows en engineering lanes. De bestaande mandatory chat-learning preflight laadt en valideert deze policy fail-closed.

De capability versnelt uitvoering door canonical current state te hergebruiken, alleen de taak-delta in context te brengen, verse evidence veilig te hergebruiken en onafhankelijke read-only retrieval parallel uit te voeren. Hij verandert geen canonical truth en maakt geen tweede memory-, queue-, orchestration- of evidence-laag.

## Canonieke componenten
- Policy: `config/powerhouse-fast-execution-v1.json`
- Runtime primitives: `scripts/brain/powerhouse-fast-execution.mjs`
- Unit/regressie: `tests/brain-fast-execution.test.mjs`
- Integratie: `tests/brain-fast-execution-integration.test.mjs`
- Learning: `brain/learning/fast-execution-2026-09-17.json`
- Mandatory entrypoint: `scripts/brain/chat-learning-preflight.mjs`
- Continuity authority: `brain/policies/powerhouse-agent-continuity-v1.json`
- Interruption recovery: `config/powerhouse-execution-resilience-v1.json`

## Uitvoeringsmodel
Elke taak wordt vooraf als `FAST`, `STANDARD` of `DEEP` geclassificeerd. De klasse bepaalt context, retrieval en reasoning-budget; governance-gates veranderen nooit.

### FAST
Status, readback, lookup, health en kleine deterministische checks. Gebruik hot/current state en verse evidence; haal alleen ontbrekende of verlopen informatie op.

### STANDARD
Reguliere fixes, features, wijzigingen, tests en deploys. Gebruik canonical current state, de minimale delta en relevante dependencychecks plus verplichte release-gates.

### DEEP
Security, identity, schema/migrations, destructief risico, architectuurgrenzen, incident-root-cause en rollback-sensitive wijzigingen. Gebruik volledige relevante evidenceklassen en directe platformobservatie waar het contract dat vereist.

## Context en tool-output
De runtime gebruikt een stabiele policy-prefix en een taakgebonden context packet. Standaard: maximaal 24.000 tekens context en 12.000 tekens / 300 regels per tool-output. Grote historische bronnen worden niet opnieuw naar reasoning gekopieerd als canonical current state plus delta volstaat.

`bounded` betekent contextcompressie, nooit het verwijderen van required evidence. Expliciet vereiste evidence blijft vereist.

## Evidence reuse
Evidence mag alleen als tijdelijke projection worden hergebruikt wanneer `observedAt` en expiry gelden, candidate-specifieke evidence exact aan dezelfde candidate identity is gebonden, geen nieuwere contradictie/mutatie bestaat en het contract geen directe actuele platformobservatie vereist. Cache is nooit business truth.

## Parallelisme
Paralleliseer onafhankelijke read-only current-state adapters, evidence reads en health checks. Serializeer writes naar dezelfde canonical state, afhankelijke migrations, promoties na required gates en readback die een mutatie bevestigt. Mutaties blijven dedupe/idempotency/readback-first volgen.

## Interruption recovery
Snelle uitvoering mag resilience nooit omzeilen. Een afgebroken niet-terminale run blijft `RECOVERY_REQUIRED`; hervatting start bij de laatste bewezen checkpoint en reconcilet side effects vóór replay.

## Latency SLI
Instrumenteer waar mogelijk `context-build-ms`, `reasoning-ms`, `tool-wait-ms`, `test-ms`, `deploy-ms`, `readback-ms` en `total-ms`. Optimaliseer eerst overbodige context/retrieval en seriële wachttijd; verkort test/deploy/readback alleen via relevante scope, caching, batching of platformoptimalisatie, nooit via gate-skipping.

## Definition of Done
Fast execution is alleen groen wanneer de mandatory preflight de actieve default policy levert, regressie- en required gates groen zijn, exact de geteste candidate identity wordt gepromoveerd, productie/provider readback de toestand bewijst en material learning/writeback is voltooid. Terminale successtatus blijft `LIVE & BEWEZEN`; `BLOCKED_HARD_BOUNDARY` blijft beperkt tot bestaande harde grenzen.
