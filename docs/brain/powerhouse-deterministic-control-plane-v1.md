# Deterministic Powerhouse control plane — vertical slice v1

Obligation: `powerhouse-deterministic-control-plane-vertical-slice-v1`.

This change does **not** create a second Brain, queue, ledger, scheduler or database. It binds the already canonical production objects together:

- `brain_obligations`: obligation identity and lifecycle.
- `brain_operations`: idempotent execution identity.
- `brain_control_plane_bindings`: mandatory actor/session admission.
- `brain_delivery_evidence`: append-only machine evidence.
- existing GitHub delivery state machine / One Loop: exact-head, merge, deploy and recovery authority.

The vertical slice is mechanically closed by `powerhouse_control_plane_close_v1`. It refuses terminal closure until green evidence exists for USER_INTENT, EXECUTION, PROD_READBACK, OUTCOME and LEARNING. If learning declares skill projection required, SKILL_PROJECTION evidence is mandatory too.

`powerhouse_learning_compiler_route_v1` deterministically routes an incident to a lower-level prevention mechanism where possible: DATABASE_CONSTRAINT, CI_GATE, CI_SECURITY_GATE, RUNTIME_ASSERTION, WORKFLOW or TEST. SKILL is only used when the rule is not machine-enforceable.

`powerhouse_control_plane_selftest_v1` is idempotent and proves the complete USER_INTENT → OBLIGATION → EXECUTION → EVIDENCE → PROD_READBACK → LEARNING → CLOSED path directly on production Supabase.

Make remains accepted only as a **historical value** in the legacy target constraint so old evidence remains valid. The canonical control-plane writer rejects Make as an active target.
