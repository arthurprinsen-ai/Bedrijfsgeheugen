# Powerhouse System Map governance — 2026-09-28

Fingerprint: `powerhouse|system-map|same-lineage-auto-writeback|v1`

## Wijziging

System Map-onderhoud is nu een automatische Definition-of-Done-verplichting voor alle huidige en toekomstige Powerhouse chats, agents, workflows en autonome nodes.

Bij materiële wijzigingen aan skills, agents, intelligence, workflows, connectors, authority, dataflows, relaties, topology, charts of canonieke surfaces moet dezelfde delivery-lineage de machineleesbare System Map, menselijke documentatie, relevante skill-inventory, Brain learning en development ledger actualiseren.

## Borging

- Canonieke machinebron: `platform/system-map/canonical-system-map.mjs`
- Canonieke skill: `.agents/skills/powerhouse-system-map-governance/SKILL.md`
- Menselijke architectuur: `docs/powerhouse/POWERHOUSE_SYSTEM_MAP_GOVERNANCE.md`
- Regressie: `tests/brain-powerhouse-system-map-governance-v1.test.mjs`
- Fail-closed status bij stale writeback: `SYSTEM_MAP_WRITEBACK_INCOMPLETE`

De gebruiker hoeft deze writeback niet afzonderlijk meer te vragen.
