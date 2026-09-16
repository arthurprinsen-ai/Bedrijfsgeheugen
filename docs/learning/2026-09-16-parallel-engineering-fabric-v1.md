# Learning — Parallel Engineering Fabric v1

Fingerprint: `powerhouse-parallel-engineering-fabric-v1`
Date: 2026-09-16
Lineage: PR #1803

## Probleem/context
De delivery-architectuur kon al onafhankelijke lanes parallel behandelen, maar agent/chataansturing had nog geen kleine, pure planner die dependencies, changed-path overlap, conflict contracts, affected tests en cache identity in één deterministische beslissing combineerde. Daardoor ontstond coordination tax: overbrede testselectie, onnodig wachten op `main`, stale candidates en extra reconciliationwerk.

## Root cause
Parallel bouwen was als regel vastgelegd, maar nog onvoldoende gecompileerd tot één herbruikbare orchestration primitive. De ontbrekende laag zat tussen intentie/work decomposition en bestaande BRAIN-DELIVERY-v2 release lanes.

## Oplossing
- Voeg een aparte policy toe die expliciet bestaande Engineering OS/BRAIN-DELIVERY/BG169-authorities hergebruikt.
- Voeg pure, deterministische orchestration-primitives toe voor scheduling, affected testing, cache identity en speculative integration.
- Wire het contract direct in Required CI.
- Fail closed bij unknown material scope, cycles, missing dependencies en ontbrekende exact identities.
- Houd speculative integration advisory-only en productiepromotie exclusief bij bestaande protected delivery.

## TDD/evidence
De eerste testcommit importeerde bewust een nog niet bestaand `scripts/brain/parallel-engineering-fabric.mjs`; de contracttest definieerde daarmee de gewenste RED-toestand vóór de implementatiemodule werd toegevoegd. De uiteindelijke Required run op de exacte PR-head is de beslissende executable evidence; alleen die en post-merge readback mogen als groen gelden.

## Preventieregel
Bij nieuwe parallel-engineeringwensen niet nog een queue, scheduler of agent-registry bouwen. Eerst work packages door `powerhouse-parallel-engineering-fabric-v1` laten classificeren. Serializeer alleen echte dependency/path/contract-conflicten. Selecteer affected tests voor snelheid, maar laat protected release/security/production gates intact.

## Herbruikbare learning
Snelheid komt primair uit minder coördinatiewerk en minder redundante validatie, niet uit het verlagen van kwaliteitsgates. Exact identity + deterministic planning + conflict-aware concurrency maakt meer paralleliteit mogelijk zonder extra waarheidssystemen.
