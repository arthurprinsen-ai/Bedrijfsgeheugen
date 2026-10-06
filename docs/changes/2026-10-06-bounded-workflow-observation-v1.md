# Bounded workflow observation v1

## Problem
Agents could spend a long time repeatedly checking GitHub Actions after the exact candidate head and top-level workflow state were already known. This produced the visible stall “Controleren van vereiste workflowjobs” without adding evidence.

## Structural fix
- One exact-head top-level workflow snapshot per observation cycle.
- A terminal non-success allows exactly one drilldown to the first failed workflow/job/step; then repair starts.
- Unchanged queued or in-progress state is checkpointed and not re-read for 120 seconds without new evidence.
- Successful and skipped sibling jobs are not repeatedly enumerated.
- Auto-merge and remote CI continue independently while the agent performs other safe work.
- Workflow status inspection has a hard per-cycle budget of 3 status-tool reads and 30 seconds; exhausting that budget forces checkpoint + independent work.
- `planWorkflowObservation()` in `tools/delivery/predictive-controller.mjs` enforces the rule in executable code: active CI returns checkpoint/continue, terminal failure allows one drilldown, and unchanged snapshots return no-requery until cooldown.

## Result
Workflow observation becomes fail-fast and bounded. Long-running CI can still run as long as needed, but the chat/agent no longer blocks on a polling tool chain.
