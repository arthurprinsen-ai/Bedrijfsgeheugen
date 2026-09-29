---
name: powerhouse-green-assurance
description: Use for end-to-end Powerhouse health assurance, red/amber recovery, evidence freshness, provider failover, content-loop closure, and truthful green-state verification.
---

# Powerhouse Green Assurance

Fingerprint: `powerhouse|green-assurance|truthful-closed-loop|v1`.

## Doel

Maak Powerhouse niet cosmetisch groen. Herstel de onderliggende loop totdat actuele externe evidence bewijst dat de vereiste capability werkelijk werkt.

## Canonieke regel

`signal -> decision -> action -> evidence -> outcome -> measurement -> learning -> guard`

Een status mag alleen GREEN/LIVE_BEWEZEN worden wanneer de relevante keten aantoonbaar gesloten is. Een succesvolle trigger, workflow, API-call, commit, provider-ACK of deploy is op zichzelf nooit voldoende.

## Verplichte assurance-loop

1. Lees actuele runtime health, terminal control-plane health, evidence-source coverage en open obligations.
2. Herstel stale/missing required evidence met echte readback; nooit met gesynthetiseerde success-evidence.
3. Onderscheid provider-capability van één leverancier. Een niet-essentiële provider mag geen single point of failure voor de hele Brain zijn wanneer een governance-goedgekeurde provider-neutrale route bestaat.
4. Retired/legacy tooling mag telemetry leveren maar nooit de actuele groene gate blokkeren.
5. Herstel structurele lineage-gaten in de bestaande forecast/action/outcome/learning lineage; maak geen parallelle waarheid.
6. Sluit content/publication obligations via de canonieke identities en duplicate-gates. Een reeds gepubliceerde provider-side-effect met `republish_forbidden` wordt nooit opnieuw gepubliceerd.
7. Instagram blijft Mira-only en vereist exact media proof plus start/middle/end continuity evidence voordat publicatie groen wordt.
8. Alleen actuele read-after-write/readback mag een rode of oranje status promoveren.
9. Schrijf iedere materiële assurance-fix terug naar Brain learning, ledger/docs, relevante skills/agent-contracts en System Map.
10. Herbereken daarna de centrale health; meld groen alleen wanneer de onderliggende bronnen en obligations groen zijn.

## Truth boundaries

- `unknown != green`
- `stale != green`
- `provider ACK != external outcome`
- `technical success != business outcome`
- `optional provider failure != whole-brain failure`
- `legacy telemetry != required authority`
- `generated asset != published/read-back asset`
- `published once + readback-limited != permission to republish`

## Provider-neutral intelligence

External intelligence is governed as a capability, not as a single-vendor dependency. Provider-specific health remains visible, but the whole Brain is blocked only when the required provider-neutral capability has no fresh approved source.

## User-facing gedrag

Geen interne PR/SHA/queue/blocker-detail als eindhandoff. De node blijft eigenaar tot:
- `LIVE_BEWEZEN`, of
- `ROLLED_BACK_GREEN`, of
- een echte `BLOCKED_HARD_BOUNDARY` die menselijke/provider-autorisatie vereist.

## Canonieke verwijzingen

- `config/powerhouse-truth-status-contract.json`
- `brain/policies/powerhouse-agent-continuity-v1.json`
- `platform/system-map/canonical-system-map.mjs`
- `.agents/skills/powerhouse-continuity/SKILL.md`
- `public.powerhouse_one_brain_runtime_health_v1`
- `public.powerhouse_terminal_control_plane_health_v1`
- `public.powerhouse_evidence_operating_health_v3`
- `public.powerhouse_evidence_source_coverage_v1`

## Permanente learning 2026-09-29

De assurance-run bewees dat een systeem tegelijk volledig bedraad kan zijn en toch niet groen: 32/32 intelligence-lagen en 18/18 required jobs waren actief terwijl content/evidence/lineage nog rood waren. De juiste herstelstrategie is daarom evidence-first, provider-neutral en fail-closed, niet dashboard-first.
