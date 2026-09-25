# Trigger-aware terminal gate applicability

Date: 2026-09-25
Fingerprint: `delivery|terminal-gate|trigger-aware-impossible-event|v1`

Obligation Terminal Closure run `36175492847` remained in the exact-head gate step after Required, Powerhouse Skill Projection and Powerhouse CodeQL were green.

The closure workflow waited for a `pull_request` run of `unified-brain-delivery.yml`, while that workflow is configured only for `workflow_dispatch`. Such a run cannot exist.

The terminalizer now checks whether the referenced workflow can emit the expected PR event before polling it. If not, the gate is recorded as `TERMINAL_CRITICAL_GATE_NOT_APPLICABLE` with `reason=no_pull_request_trigger`.

No failing applicable gate is turned green: Required, CodeQL, skill/learning, provider and readback gates retain fail-closed semantics.
