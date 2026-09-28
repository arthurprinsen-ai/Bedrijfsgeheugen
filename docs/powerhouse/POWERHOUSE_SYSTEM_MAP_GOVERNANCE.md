# Powerhouse System Map Governance

Version: v1  
Fingerprint: `powerhouse|system-map|same-lineage-auto-writeback|v1`

## Purpose

The Powerhouse System Map is the canonical architecture view of how all skills, agents, intelligence layers, workflows, connectors, authorities, data flows and control surfaces work together.

The machine-readable source is:

`platform/system-map/canonical-system-map.mjs`

The intended Portal V2 projection is:

`https://www.bedrijfsgeheugen.nl/portal-v2/?page=powerhouse-control-center`

## Non-negotiable contract

Every current and future chat, agent, workflow and autonomous node inherits System Map maintenance automatically.

Whenever a material change alters Powerhouse topology, capability, ownership or relationships, the same delivery lineage must update:
- the machine-readable System Map;
- the relevant skill/capability inventory;
- agent ownership/routing/relations where changed;
- human architecture/change documentation;
- Brain learning/prevention;
- the append-only development ledger;
- any human/portal projection that visualizes the changed topology.

A change is not completely closed while the System Map is stale.

## What must be represented

The map must remain sufficient to answer:
- Which intelligence layers exist?
- Which agents/capabilities exist and who owns them?
- Which skills govern execution?
- Which workflows, schedulers and connectors are active?
- Which source is authoritative for each class of truth?
- Which nodes depend on or feed which other nodes?
- Which control surfaces and charts project the canonical truth?
- Which external providers are evidence sources versus authority?
- How does learning flow back into skills, decisions and future execution?

## Closure status

Missing System Map writeback produces `SYSTEM_MAP_WRITEBACK_INCOMPLETE`.

Missing wider repository-native closure produces `WRITEBACK_INCOMPLETE`.

Neither is compatible with `PRODUCTION_GREEN`, `LIVE_BEWEZEN` or equivalent terminal claims.

## Automatic maintenance

System Map maintenance is part of the Definition of Done, not a separate user-requested documentation task. Agents must perform read-after-write verification before terminal closure.

