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



## Company Intelligence OS

Powerhouse is architecturally governed as an AI-native Company Operating System / Company Intelligence Platform.

CRM is a source adapter, not the brain. Company, person, opportunity, action, outcome and realized-value evidence is projected into one Company Graph and compiled into a System of Context before decisions and actions.

Canonical loop:

`Evidence → Company Graph → System of Context → Prediction/Decision → Autonomous Action → Provider Readback → Outcome Memory → Realized Value → Calibration → Next Decision`

Canonical runtime surfaces:
- `public.powerhouse_company_graph_nodes_v1`
- `public.powerhouse_company_graph_edges_v1`
- `public.powerhouse_system_of_context_v1`
- `public.powerhouse_autonomous_action_layer_v1`
- `public.powerhouse_outcome_memory_v1`
- `public.powerhouse_compound_intelligence_v1`
- `brain/company-intelligence/company-intelligence-os.mjs`
- `brain/contracts/company-intelligence-os-v1.json`
- `.agents/skills/powerhouse-company-intelligence-os/SKILL.md`

All future skills, agents, connectors and portal capabilities that touch company intelligence must reuse these layers rather than create a parallel CRM, graph, context store or learning loop.
