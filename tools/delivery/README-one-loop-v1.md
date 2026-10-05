# POWERHOUSE-ONE-LOOP-v1 delivery surface

This directory remains part of the existing Powerhouse delivery control-plane. One Loop adds pure lifecycle, recovery, admission and GitHub-learning decisions; it does not add a queue or source of truth.

Entrypoints:

- `one-loop.mjs` — lifecycle, terminal-state, lease, finishing-pressure and reconciliation decisions.
- `one-loop-check.mjs` — cheap admission surface for workflow integration.
- `one-loop-reconcile.mjs` — idempotent run reconciliation surface.
- `github-learning.mjs` — deterministic GitHub telemetry normalization/fingerprinting.

All material workflow integration must preserve existing protected `test`, security, exact-head and production-readback authorities.


## Exact-head full commit check authority

Terminal delivery may only declare a candidate green/merge-ready from the complete GitHub check-run set for the exact candidate SHA plus legacy commit statuses. Required branch-protection checks are a subset, not the source of truth.

The gate is fail-closed for pending or failed checks and for neutral security checks (including GitHub Advanced Security / CodeQL). Informational neutral checks from non-security providers may remain terminal evidence. This prevents a normal workflow CodeQL run from masking a separate Advanced Security check.
