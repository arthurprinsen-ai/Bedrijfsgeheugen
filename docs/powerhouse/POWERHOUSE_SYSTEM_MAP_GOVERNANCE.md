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

`Evidence → Company Graph → System of Context → Prediction/Decision → Autonomous Action → Provider Readback → Outcome Memory → Realized Value → Learning → Compound → Next Decision`

Canonical runtime surfaces:
- `public.powerhouse_company_graph_nodes_v1`
- `public.powerhouse_company_graph_edges_v1`
- `public.powerhouse_system_of_context_v1`
- `public.powerhouse_autonomous_action_layer_v1`
- `public.powerhouse_outcome_memory_v1`
- `public.powerhouse_compound_intelligence_v1`
- `public.powerhouse_run_company_intelligence_os_v1(date)`
- `brain/company-intelligence/company-intelligence-os.mjs`
- `brain/contracts/company-intelligence-os-v1.json`
- `.agents/skills/powerhouse-company-intelligence-os/SKILL.md`

All future skills, agents, connectors and portal capabilities that touch company intelligence must reuse these layers rather than create a parallel CRM, graph, context store or learning loop.


## Self-Improvement Layer

Powerhouse uses one controlled compounding loop above Company Intelligence. It composes existing optimization, quality, model-health, autonomous-improvement and protected-delivery authorities; it does not create a second learning store or a second production writer.

Canonical loop:

`Observe → Detect → Hypothesize → Build → Test → Evaluate → Compare → Promote → Measure → Learn`

Canonical runtime:
- `public.powerhouse_agent_objective_registry_v1`
- `public.powerhouse_learning_compiler_queue_v1`
- `public.powerhouse_self_improvement_control_v1`
- `public.powerhouse_run_self_improvement_layer_v1(date)`
- `brain/self-improvement/self-improvement-layer.mjs`
- `brain/contracts/self-improvement-layer-v1.json`
- `.agents/skills/powerhouse-self-improvement-layer/SKILL.md`

North Star: Powerhouse must function measurably better tomorrow than today without degrading reliability, safety or code quality.

Self-learning may autonomously observe, diagnose, generate candidates and evaluate them. Production promotion remains evidence-gated and reuses protected delivery. Unknown evidence is never green.
