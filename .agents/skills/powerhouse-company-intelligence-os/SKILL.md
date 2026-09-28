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

## Production proof

A Company Intelligence OS change is not terminally complete until the canonical runtime projections are readable in production and their counts/shape are checked. The production closure readback on 2026-09-28 verified all five layers against real canonical data: Company Graph nodes/edges, System of Context, Autonomous Action Layer, Outcome Memory and Compound Intelligence.

Closure rules:
- Promote the System Map capability to `LIVE_PROVEN_RUNTIME` only after production readback.
- Record production evidence in the learning record and development ledger; never leave a stale `CANDIDATE_DELIVERY` status after proof exists.
- Production proof is readback evidence, not merely migration presence or CI success.
- Re-read canonical runtime after deployment; never infer live state from GitHub alone.
