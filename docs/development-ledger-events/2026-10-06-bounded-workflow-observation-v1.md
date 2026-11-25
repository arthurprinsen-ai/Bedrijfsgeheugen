# Development ledger event — bounded workflow observation v1

- Date: 2026-10-06
- Obligation: `bounded-workflow-observation-20261006-v1`
- Lane: automation
- Escaped defect: repeated unchanged GitHub workflow inspection could hold the agent in a long tool chain.
- Root cause: observation had bounded provider polling in principle, but no explicit single-snapshot / single-failure-drilldown contract for agent-side workflow inspection.
- Decision: one top-level exact-head snapshot per cycle; at most one failed workflow/job/step drilldown; unchanged active state checkpoints for 120 seconds.
- Preserved authorities: exact-head gates, CodeQL, Required test, branch protection, auto-merge and terminal production/provider readback remain unchanged.
- Executable enforcement: `tools/delivery/predictive-controller.mjs#planWorkflowObservation` is the deterministic runtime planner for snapshot, cooldown, failure-drilldown and observation-budget decisions.
