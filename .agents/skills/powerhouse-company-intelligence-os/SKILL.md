---
name: powerhouse-company-intelligence-os
description: Use for every Powerhouse feature, agent, workflow, portal capability, revenue action, enrichment path or learning loop that reasons about companies, people, CRM, context, decisions, actions, outcomes or realized value.
---

# Powerhouse Company Intelligence OS

Fingerprint: `powerhouse|company-intelligence-os|know-decide-act-learn|v1`.

## Canonical architecture

Powerhouse is an AI-native Company Operating System / Company Intelligence Platform.

CRM is a source adapter only. It may contribute identity, relationship and opportunity evidence, but it is never the canonical brain.

The mandatory architecture is:

1. Company Graph
2. System of Context
3. Prediction / Decision Intelligence
4. Autonomous Action Layer
5. Provider Readback
6. Outcome Memory
7. Realized Value
8. Compound Intelligence / Calibration
9. Next Decision

## Canonical runtime surfaces

- Company Graph nodes: `public.powerhouse_company_graph_nodes_v1`
- Company Graph edges: `public.powerhouse_company_graph_edges_v1`
- System of Context: `public.powerhouse_system_of_context_v1`
- Autonomous Action Layer: `public.powerhouse_autonomous_action_layer_v1`
- Outcome Memory: `public.powerhouse_outcome_memory_v1`
- Compound Intelligence: `public.powerhouse_compound_intelligence_v1`
- Brain module: `brain/context/company-intelligence-os.mjs`
- Contract: `brain/contracts/company-intelligence-os-v1.json`

## Mandatory invariants

- No parallel CRM.
- No parallel graph truth.
- No domain-local learning silo.
- Every action requires context and lineage.
- Every outcome links back to its originating action/cycle where evidence permits.
- Realized value is observed, never synthesized.
- Every next decision consumes verified outcomes and realized value when available.
- Evidence provenance, freshness and confidence remain explicit.
- External side effects reuse existing channel identity, consent, authorization and safety gates.
- Material structural change requires System Map writeback in the same lineage.

## Agent behavior

Before creating a new company, CRM, enrichment, revenue, content, workflow or AI-agent capability:
1. inspect the existing Company Graph and System of Context;
2. reuse canonical entities and decision-cycle lineage;
3. project new source evidence into the graph/context rather than creating a new datastore;
4. route executable work through the Autonomous Action Layer;
5. capture provider readback and outcome evidence;
6. update Outcome Memory and calibration;
7. feed the result into the next decision.

A connector is not intelligence. A CRM row is not context. A recommendation is not an outcome. A sent action is not success. A provider acknowledgement is not realized value.

## Product language

Preferred category language:
- AI-native Company Operating System
- Company Intelligence Platform
- Intelligence and Execution Layer for your company

Core loop:
`Know → Understand → Decide → Act → Measure → Learn`
