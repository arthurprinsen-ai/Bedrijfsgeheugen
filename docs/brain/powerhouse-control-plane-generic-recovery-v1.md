# Powerhouse generic recovery v1

This extends the existing Brain reconciliation control plane rather than adding another queue or workflow authority.

New canonical operations are enrolled in `execution_resilience` at creation. Recovery remains readback-first.

A reconciliation job may return an operation from `RESULT_UNKNOWN` to `PLANNED` only when the operation itself proves:

- `readback_before_replay = true`;
- `side_effect_state = NOT_STARTED`.

The worker increments `dispatch_generation`, records `REPLANNED_SAFE`, resolves the reconciliation job and exposes `DISPATCH` as the next action. It does **not** execute the provider side effect itself. If the side-effect state is missing or ambiguous, the worker remains fail-closed.

`powerhouse_control_plane_next_action_v1` is a read-only projection over `brain_operations`; it is cockpit/readback state, not a second source of workflow truth.
