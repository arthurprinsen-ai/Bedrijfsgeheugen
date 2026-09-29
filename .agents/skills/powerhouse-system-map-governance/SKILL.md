---
name: powerhouse-system-map-governance
description: Use for every material Powerhouse change that adds, removes, renames, changes ownership of, or changes relationships between skills, agents, intelligence, workflows, connectors, data flows, authorities, charts or control surfaces.
---

# Powerhouse System Map Governance

Fingerprint: `powerhouse|system-map|same-lineage-auto-writeback|v1`.

## Canonical surfaces

- Machine-readable authority: `platform/system-map/canonical-system-map.mjs`
- Human architecture: `docs/powerhouse/POWERHOUSE_SYSTEM_MAP_GOVERNANCE.md`
- Portal projection: `/portal-v2/?page=powerhouse-control-center`
- Human mirror/handbook: the Notion System Map authority already registered in the canonical map.

## Mandatory behavior

Every current and future chat, agent, workflow or autonomous node that makes a material structural Powerhouse change MUST update the System Map in the same delivery lineage.

A material structural change includes at least:
- skill/capability creation, deletion, rename, version or responsibility change;
- agent creation, deletion, ownership, routing, inputs, outputs or authority change;
- intelligence-layer or decision-loop change;
- workflow, scheduler, connector, provider or runtime-authority change;
- data-flow, dependency, relation, topology or control-surface change;
- chart/dashboard/surface addition or removal when it represents canonical Powerhouse topology or intelligence.

## Required writeback

Before terminal status, update as applicable:
1. machine-readable System Map;
2. human architecture/change documentation;
3. relevant skill inventory and ownership/relationship metadata;
4. Brain learning/prevention;
5. append-only development ledger;
6. portal/human projection if topology is shown there.

Then perform a read-after-write and prove the new node/relation is discoverable.

## Fail closed

If the underlying change is complete but the System Map, human documentation or required projection is stale, the state is:
- `SYSTEM_MAP_WRITEBACK_INCOMPLETE` for System Map drift;
- `WRITEBACK_INCOMPLETE` for other missing closure artifacts.

Neither state is terminal green.

## No manual reminder dependency

The user must never need to ask separately to "update skills/documentation/system map". This obligation is inherited automatically from AGENTS.md by all current and future Powerhouse execution nodes.


## Contextual visibility governance

For every material intelligence, prediction, recommendation, benchmark, graph, risk, opportunity or learning capability, the delivery owner must decide whether the capability changes a user decision.

If yes, same-lineage closure MUST include:
1. the relevant Portal V2 contextual projection;
2. a compact visual representation appropriate to that page;
3. evidence/uncertainty state where applicable;
4. regression coverage proving the projection is wired;
5. System Map relationship from capability → portal surface.

A backend-only implementation is non-terminal when the intelligence materially affects user decisions. Do not solve this by creating a generic "AI insights" dumping ground; place the intelligence where it is operationally relevant.


## Canonical website shell is a Powerhouse control surface

Fingerprint: `powerhouse|website-shell|canonical-chrome-geometry|v1`.

The public Bedrijfsgeheugen chrome is a canonical Powerhouse control surface. Its header, navigation, footer and mega-menu geometry belong to one centrally governed shell contract.

Structural website-shell changes must therefore:
- update `platform/system-map/canonical-system-map.mjs`;
- update `docs/sitestandaard.md`;
- preserve sitewide pixel-parity regression coverage;
- avoid route-local geometry forks;
- remain discoverable from Powerhouse Control Center / System Map governance.

The current geometry contract is 1220px desktop shell width, 72px navigation height, 1190px maximum centered “Meer” mega-menu and 850px solutions mega-menu, with mobile gutters centrally defined.


## Daily Compound Learning inheritance

Fingerprint: `powerhouse|daily-compound-learning|all-nodes-inherit|v1`.

This skill inherits the canonical daily compound-learning contract. Every material chat/agent execution must:
- consume bounded shared context and existing learning before acting;
- preserve one canonical outcome/forecast/learning lineage;
- treat only verified observed evidence as outcome truth;
- never convert silence, transport success, synthetic/test events or forecasts into realized outcomes;
- feed verified outcomes into Company Intelligence, Forecast Calibration and Self-Improvement;
- write material learning/prevention back so the next chat or agent changes its next decision;
- remain discoverable through System Map and canonical skill projection.

Canonical runtime: `public.powerhouse_run_daily_compound_learning_v1(date)`.
