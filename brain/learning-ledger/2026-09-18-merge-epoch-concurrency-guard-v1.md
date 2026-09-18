# Merge-epoch concurrency guard — production learning

Datum: 2026-09-18  
Type: INCIDENT / ROOT_CAUSE / PREVENTION / PRODUCTION_PROOF  
Fingerprint: `delivery|merge-epoch|optimistic-cas|v1`

## Aanleiding

PR #2074 had een groene exact-head gate-run, maar `main` was tijdens die run verder gegaan. De kandidaat stond daarna 10 commits achter en GitHub rapporteerde een echte merge-conflictstatus. Het incident bewees dat candidate-head-groen alleen onvoldoende landing-authoriteit is in een repository waar meerdere chats en agents gelijktijdig leveren.

## Root cause

De terminale autoriteit was wel aan de candidate head gebonden, maar niet tegelijk aan de actuele `main`-epoch en kortdurend landing-eigenaarschap. Daardoor kon bewijs geldig blijven lijken nadat de integratiebasis al was veranderd.

## Structurele preventie

- terminale landing bindt exact tested head aan exact current-main SHA;
- `behind_by = 0` is verplicht bij landing;
- conflict/CAS-refusal wordt recovery-input;
- iedere main-beweging na gate-proof maakt landing-proof ongeldig;
- recovery blijft op dezelfde obligation/candidate-lineage;
- volledige current-main union blijft behouden bij reconcile;
- parallel development blijft toegestaan; alleen de terminale landing wordt geserialiseerd;
- leading indicators worden gebruikt om conflict-risico vroeg te herkennen.

## Productiebewijs

De structurele guard is via PR #2092 beschermd gemerged.

- candidate head: `b2d9bc5a7fede7235762e6706fedea9a621673f3`
- production merge SHA: `fa0de9e319bc0fb440d0dd342d9688d49ed5414c`
- Required: success
- Unified BRAIN: success
- CodeQL: success
- main readback: verified

## Skill-projectie

De learning is ontsloten via:

- `.agents/skills/powerhouse-delivery-concurrency/SKILL.md`
- `.agents/skills/powerhouse-continuity/SKILL.md`
- `brain/skills/powerhouse-delivery-concurrency-v1.json`

Hierdoor hoeft een volgende chat/agent dit incident niet opnieuw te reconstrueren en kan preflight de preventieregel direct hergebruiken.
