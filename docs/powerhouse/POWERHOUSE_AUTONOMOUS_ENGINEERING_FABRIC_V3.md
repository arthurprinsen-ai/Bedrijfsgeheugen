# Powerhouse Autonomous Engineering Fabric v3

## Doel

Powerhouse ontwikkelt voortaan als één softwarefabriek in plaats van als losse chats die allemaal rechtstreeks dezelfde branch en dezelfde shared files muteren.

## Architectuur

Intent → Planner → work packages → capability routing → parallel specialist execution → Integration Agent → impacted tests → coherent candidate → protected GitHub gates → merge → production readback → late-bound closure → learning.

### Eén candidate-writer

Specialistische agents mogen parallel ontwerpen, analyseren, code en tests voorbereiden, maar de gedeelde candidate heeft één writer: `agent-integration-engineer`. Hierdoor ontstaan minder branch-head updates, minder geannuleerde CodeQL/Required-runs en minder merge-conflicten.

### Risk-aware testing

- R0: documentatie/non-executable.
- R1: geïsoleerde UI/content.
- R2: gewone applicatiecode.
- R3: gedeelde runtime/control-plane.
- R4: security/auth/database/externe side-effects.

Tijdens ontwikkeling worden impacted tests gebruikt. Onbekende materiële scope faalt dicht naar de volledige Required-profile. De protected release gate blijft altijd bestaan.

### Capability routing

Agentselectie gebruikt domein- en capability-fit en, na voldoende observaties, echte outcomes: first-pass success, rework, CI failures, productie-incidenten en lead time. Hierdoor leert de planner welke specialist welk type werk aantoonbaar beter uitvoert.

### Late-bound closure compiler

Learning, change-documentatie, development ledger, skill-projecties, System Map-delta en release-evidence worden na de functioneel coherente candidate samengesteld. Hiermee verdwijnen veel onnodige tussentijdse commits op hot shared files.

### Dagelijkse optimizer

De optimizer gebruikt Powerhouse CI Intelligence en past alleen begrensde tuning aan. Bij queue-druk of veel cancellations verlaagt hij parallelle runnerdruk en vergroot hij batching. Bij lage druk en lage failure-rate kan hij veilig meer parallelisme toestaan. Bij hoge failure-rate verhoogt hij de confidence threshold voor speculative execution.

Safety-invarianten kunnen nooit door de optimizer worden uitgezet.
