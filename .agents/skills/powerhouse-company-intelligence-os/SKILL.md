---
name: powerhouse-company-intelligence-os
description: Use for every Powerhouse task involving company context, CRM/customer intelligence, relationships, opportunities, next-best-actions, agents, outcomes, learning or cross-domain decision intelligence.
---

# Powerhouse Company Intelligence OS

Fingerprint: `powerhouse|company-intelligence-os|know-decide-act-observe-learn-compound|v1`.

## Canonical model

Powerhouse is the company intelligence and execution layer. CRM is one source among many; it is never the brain.

Mandatory loop:

`Know → Understand → Decide → Act → Observe → Learn → Compound`

Canonical layers:
1. **Company Graph** — typed nodes/edges over canonical people, companies, opportunities, actions and decision lineage.
2. **System of Context** — a current, relevant, confidence-weighted context envelope; never a parallel datastore.
3. **Autonomous Action Layer** — route through the existing Powerhouse action/agent fabric and explicit execution boundaries.
4. **Outcome Memory** — store/retrieve observed results with evidence and provenance.
5. **Compound Intelligence** — outcomes must improve a future prediction, priority, policy or next-best-action.

## Runtime authorities

- Graph nodes: `public.powerhouse_company_graph_nodes_v1`
- Graph edges: `public.powerhouse_company_graph_edges_v1`
- Context: `public.powerhouse_system_of_context_v1`
- Actions: `public.powerhouse_autonomous_action_layer_v1`
- Outcome memory: `public.powerhouse_outcome_memory_v1`
- Compound loop: `public.powerhouse_compound_intelligence_v1`
- Orchestration: `public.powerhouse_run_company_intelligence_os_v1(date)`
- Pure architecture module: `brain/company-intelligence/company-intelligence-os.mjs`
- Contract: `brain/contracts/company-intelligence-os-v1.json`

## Hard rules

- Reuse canonical source tables before adding storage.
- Never create a second CRM, opportunity store, action queue, outcome ledger or learning store.
- Every graph fact and context conclusion retains a canonical reference/evidence lineage.
- Never promote an estimate, forecast or expected value to a realized outcome.
- Human/provider authorization gates stay intact; autonomous means bounded execution under existing policy, not bypassing controls.
- Sensitive-person inference is forbidden.
- A learning is incomplete unless it can alter a subsequent decision or action.
- Material changes inherit `powerhouse-system-map-governance`: update map, docs, learning and tests in the same lineage.

## Terminal production proof

A Company Intelligence OS delivery is terminal only after production readback proves the canonical runtime projections. Migration presence, CI success or a merged PR alone are not sufficient.

Required closure behavior:
- Re-read Company Graph, System of Context, Autonomous Action Layer, Outcome Memory and Compound Intelligence in production.
- After proof, promote the canonical System Map capability to `LIVE_PROVEN_RUNTIME` in the same lineage.
- Persist the proof in learning/prevention and the development ledger.
- Never leave a stale candidate status after production evidence exists.
- Never create a second proof/store/queue to represent the same runtime truth.

Verified baseline on 2026-09-28: 42,217 graph nodes; 25,164 graph edges; 17,328 company contexts; 2,883 action-layer rows; 12 outcome-memory rows; 17,328 compound-intelligence company rows.

## Self-improvement bridge

Verified Company Intelligence outcomes feed `powerhouse-self-improvement-layer`. That layer may recalibrate agents, model-routing candidates, policies, tests and engineering candidates, but must reuse Outcome Memory, existing optimization evidence and protected delivery. It must never create a parallel graph, outcome ledger, learning store or uncontrolled production writer.

## Contextual portal projection

Company Intelligence is visible **where a user decides or acts**, not as a separate dashboard.

Required customer-facing surfaces:
- executive cockpit;
- company/decision cockpit;
- impact/value context;
- next-best-actions;
- monitoring & learning;
- evidence health;
- roadmap/execution.

Portal rule: show the understandable loop `Ziet → Begrijpt → Beslist → Doet → Leert`, with compact graph context and Outcome Memory where evidence exists. Use only tenant-scoped portal/runtime evidence. Do not read globally aggregated Company Intelligence views directly into customer UI until tenant isolation is explicit and production-proven. Missing evidence must render as unknown/empty, never as invented context. Roadmap cards may expose impact/effort/intelligence tags only when those values exist in canonical tenant context; Capability Graph must be connected to decision/action/outcome context rather than shown as an isolated diagram.


## Contextual intelligence visibility invariant

Any intelligence that can materially change a management decision must be projected into the relevant Portal V2 context rather than existing only in Brain, Supabase, logs or a standalone intelligence page.

Required behavior:
- show the intelligence where the user decides, prioritizes or acts;
- prefer compact visual context over detached technical dashboards;
- reuse canonical tenant-scoped evidence and runtime authorities;
- show uncertainty, provenance and evidence state when applicable;
- never fabricate an insight, forecast, benchmark, scenario or action when evidence is insufficient;
- avoid duplicate widgets: project only the subset relevant to the current decision context;
- connect predictions to actions and outcomes so the user can see not only what may happen, but what Powerhouse recommends doing and what happened afterward.

A material intelligence capability is incomplete until its customer-facing projection is implemented where relevant, tested and documented.
