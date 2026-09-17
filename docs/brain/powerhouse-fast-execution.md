# Powerhouse Fast Execution v1

## Status
`POWERHOUSE-FAST-EXECUTION-v1` is de default execution-policy voor alle huidige en toekomstige materiële Bedrijfsgeheugen chats, agents, workflows en engineering lanes. De bestaande mandatory chat-learning preflight laadt en valideert deze policy fail-closed.

De capability versnelt uitvoering door canonical current state te hergebruiken, alleen de taak-delta in context te brengen, verse evidence veilig te hergebruiken en onafhankelijke read-only retrieval parallel uit te voeren. Hij verandert geen canonical truth en maakt geen tweede memory-, queue-, orchestration- of evidence-laag.

Productiestatus: `LIVE & BEWEZEN`. Runtime-release PR #1891 is gemerged naar protected `main` met merge-commit `4a996594dd908e1641bc60c41bd13ee030c59f4c`. De finale closed-loop learning/writeback is via PR #1893 gemerged als `2ec19ab3e8c83cf2e2451525390c9e3e122ac3a5`. Het canonieke learning-record staat op `LIVE_AND_PROVEN` en heeft geen open obligation.

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

## Intentie boven losse keywords
Taakclassificatie moet semantische intentie volgen en mag niet blind op operationele zelfstandige naamwoorden reageren. De productiegang vond een concrete regressie: `status readback van huidige deploy` werd aanvankelijk `STANDARD` omdat het woord `deploy` als mutatie werd geïnterpreteerd.

Preventieregel: expliciete read-only intentie (`status`, `readback`, `check`, `inspect`, `health`, `lookup`) wint van ambigue operation-nouns zolang geen werkelijk muterend werkwoord of opdracht aanwezig is. `status/readback van deploy` blijft dus `FAST`; `fix bug en deploy feature`, `update deployment` en vergelijkbare mutaties blijven `STANDARD` of hoger op basis van risico. Beide kanten moeten in regressietests blijven staan.

## Context en tool-output
De runtime gebruikt een stabiele policy-prefix en een taakgebonden context packet. Standaard: maximaal 24.000 tekens context en 12.000 tekens / 300 regels per tool-output. Grote historische bronnen worden niet opnieuw naar reasoning gekopieerd als canonical current state plus delta volstaat.

`bounded` betekent contextcompressie, nooit het verwijderen van required evidence. Expliciet vereiste evidence blijft vereist.

## Evidence reuse
Evidence mag alleen als tijdelijke projection worden hergebruikt wanneer `observedAt` en expiry gelden, candidate-specifieke evidence exact aan dezelfde candidate identity is gebonden, geen nieuwere contradictie/mutatie bestaat en het contract geen directe actuele platformobservatie vereist. Cache is nooit business truth.

Evidence van een andere candidate, ongebonden release-evidence en verlopen evidence moeten fail-closed worden afgewezen. Een cache-hit vervangt nooit verplichte directe productie-observatie.

## Parallelisme
Paralleliseer onafhankelijke read-only current-state adapters, evidence reads en health checks. Serializeer writes naar dezelfde canonical state, afhankelijke migrations, promoties na required gates en readback die een mutatie bevestigt. Mutaties blijven dedupe/idempotency/readback-first volgen.

## Interruption recovery
Snelle uitvoering mag resilience nooit omzeilen. Een afgebroken niet-terminale run blijft `RECOVERY_REQUIRED`; hervatting start bij de laatste bewezen checkpoint en reconcilet side effects vóór replay.

## Latency SLI
Instrumenteer waar mogelijk `context-build-ms`, `reasoning-ms`, `tool-wait-ms`, `test-ms`, `deploy-ms`, `readback-ms` en `total-ms`. Optimaliseer eerst overbodige context/retrieval en seriële wachttijd; verkort test/deploy/readback alleen via relevante scope, caching, batching of platformoptimalisatie, nooit via gate-skipping.

Iedere materiële latency-regressie, herhaalde onnodige retrieval, contextbloat, stale-evidence incident of vermijdbare seriële wachttijd wordt als canonical learning teruggeschreven met root cause, fix, regressietest/preventieregel en waar beschikbaar gemeten voor/na-evidence.

## Bewezen productie-evidence
De runtime-candidate `a8bccc4c538b10a9ca7d841ef5c62960571c97ac` heeft na de intent-aware classifierfix exact-head BRAIN backend, portal, website en automation succesvol doorlopen. Daarnaast waren Chat learning preflight, Shared Agent Memory, Learning Contract Delivery Classifier Tests, V18 Production Promotion, Brain foundation verify, Engineering Intelligence and Trust, Engineering Supply Chain Trust, Component Foundation TDD, Canonical brand shell contract/build/live readback, BG168 Materiality Promotion Tests, CodeQL en Powerhouse CodeQL groen voor de productierelease.

De mandatory preflight op `main` vereist de fast-execution policy als supplemental source, fail-closes tenzij de policy `ACTIVE` en `default_enabled=true` is, controleert dat het runtime-entrypoint bestaat en exposeert `fastExecution` metadata aan materiële chat/agent-entrypoints.

## Hergebruik door alle agents en chats
Nieuwe en bestaande materiële agents/chats starten niet vanuit volledige historie. Zij gebruiken standaard: mandatory preflight → active fast-execution policy → canonical hot/current state → taak-delta → ontbrekende/expired evidence on demand. Alleen bij risico of ontbrekend bewijs wordt verbreed naar STANDARD/DEEP retrieval.

Geen agent mag voor snelheid een parallel geheugen, eigen truth store, aparte evidence-cache als authority, tweede queue of alternatieve orchestrator introduceren. Optimalisatie blijft een projectie boven dezelfde canonieke Powerhouse-authority.

## Definition of Done
Fast execution is alleen groen wanneer de mandatory preflight de actieve default policy levert, regressie- en required gates groen zijn, exact de geteste candidate identity wordt gepromoveerd, productie/provider readback de toestand bewijst en material learning/writeback is voltooid. Terminale successtatus blijft `LIVE & BEWEZEN`; `BLOCKED_HARD_BOUNDARY` blijft beperkt tot bestaande harde grenzen.

Een wijziging aan fast execution is pas afgerond wanneer ook de documentatie en `brain/learning/fast-execution-2026-09-17.json` overeenkomen met de actuele productie-evidence en geen bekende technisch oplosbare open obligation meer bevatten.
