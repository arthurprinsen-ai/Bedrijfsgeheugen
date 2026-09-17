# Powerhouse Fast Execution v1

## Status
`POWERHOUSE-FAST-EXECUTION-v1` is de default execution-policy voor materiële Bedrijfsgeheugen chats, agents, workflows en engineering lanes zodra de mandatory chat-learning preflight hem laadt.

De capability versnelt uitvoering door minder opnieuw te lezen, kleinere context te gebruiken, verse evidence te hergebruiken en onafhankelijke read-only retrieval parallel uit te voeren. Hij verandert geen canonical truth en maakt geen tweede memory-, queue-, orchestration- of evidence-laag.

## Canonieke componenten
- Policy: `config/powerhouse-fast-execution-v1.json`
- Runtime primitives: `scripts/brain/powerhouse-fast-execution.mjs`
- Tests: `tests/powerhouse-fast-execution.test.mjs`
- Learning: `brain/learning/fast-execution-2026-09-17.json`
- Mandatory entrypoint: `scripts/brain/chat-learning-preflight.mjs`
- Bestaande continuity authority: `brain/policies/powerhouse-agent-continuity-v1.json`

## Uitvoeringsmodel
Elke taak wordt vooraf als `FAST`, `STANDARD` of `DEEP` geclassificeerd. De klasse bepaalt hoeveel context, retrieval en reasoning nodig is; zij verandert nooit welke governance-gates verplicht zijn.

### FAST
Voor status, readback, lookup, health en kleine deterministische checks. Gebruik hot state en verse evidence; haal alleen ontbrekende of verlopen informatie op.

### STANDARD
Voor reguliere fixes, features, wijzigingen, tests en deploys. Gebruik canonical current state, de minimale delta en alleen relevante dependencychecks plus verplichte release-gates.

### DEEP
Voor security, identity, schema/migrations, destructief risico, architectuurgrenzen, incident-root-cause en rollback-sensitive wijzigingen. Gebruik de volledige relevante evidenceklassen en directe platformobservatie waar het contract dat vereist.

## Contextcontract
De runtime bouwt een stabiele policy-prefix en een taakgebonden context packet. De standaardgrens is 24.000 tekens voor de context pack en 12.000 tekens / 300 regels voor individuele tool-output. Grote historische bronnen worden niet opnieuw in modelcontext gestopt als canonical current state plus delta voldoende is.

`bounded` betekent alleen contextcompressie. Het is nooit toestemming om required evidence te verwijderen. Een expliciet vereiste evidence-ref blijft vereist.

## Evidence reuse
Evidence mag tijdelijk als lokale projection worden hergebruikt wanneer:
- `observedAt` bekend is;
- een expliciete expiry/TTL geldt;
- candidate-specifieke evidence aan dezelfde candidate identity is gebonden;
- er geen nieuwere contradictie of state mutation is;
- het contract geen directe actuele platformobservatie vereist.

Een cache is nooit business truth. Bij expiry, candidate-wissel, source-version change, contradiction of materiële state mutation wordt hij ongeldig.

## Parallelisme
Paralleliseer onafhankelijke read-only current-state adapters en onafhankelijke evidence/health reads. Serializeer writes naar dezelfde canonical state, afhankelijke migrations, promoties na required gates en readback die een mutatie moet bevestigen.

Muterende side effects blijven dedupe/idempotency/readback-first volgen.

## Latency SLI
Iedere instrumenteerbare material run kan de volgende velden vastleggen:
- `context-build-ms`
- `reasoning-ms`
- `tool-wait-ms`
- `test-ms`
- `deploy-ms`
- `readback-ms`
- `total-ms`

Optimalisatie richt zich eerst op onnodige context/retrieval en seriële tool-wachttijd. Test-, deploy- en readbacktijd mag alleen worden verkort door relevante scope, caching, batching of platformoptimalisatie; nooit door gates over te slaan.

## Definition of Done
Fast execution is voor een wijziging alleen groen als:
1. de bestaande mandatory Powerhouse preflight de policy levert;
2. de relevante regressietests groen zijn;
3. required GitHub/release gates groen zijn;
4. exact de geteste candidate identity wordt gepromoveerd;
5. productie/provider readback de bedoelde toestand bewijst;
6. materiële learning en eventuele resterende obligation canoniek zijn teruggeschreven.

Terminale successtatus blijft `LIVE & BEWEZEN`. `BLOCKED_HARD_BOUNDARY` is alleen toegestaan voor de bestaande harde grenzen.
