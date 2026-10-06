# Historical terminal reconciliation v1

PR #3741 exposed two independent defects: a legacy terminalizer could emit fabricated runtime/outcome booleans, while its separate Production Release Readback could remain indefinitely in progress even when the change was a Supabase migration-history recovery with no runtime deployment authority.

PR #3758 corrected the forward path by routing production proof by runtime authority and by representing non-runtime or migration-history recovery as explicit not-applicable evidence. This change adds the missing backward-compatible reconciliation lane.

The lane is fail-closed. It only reconciles registry-pinned merged pull requests, validates the exact merge SHA and obligation identity, proves the merge is contained in current main, re-derives changed paths from Git history, and applies the current authority classification. Runtime changes without a wired authority are rejected.

Legacy workflow state is retained as historical evidence but is no longer authoritative. The superseding artifact records the stale run id and invalid legacy terminalizer run id explicitly, while never converting not-applicable proof into runtime-function or outcome proof.

## Revalidation — 2026-10-06

PR #3813 proved the reconciliation code and exact-HEAD delivery gates, but its post-merge terminalizer rejected `config/historical-terminal-reconciliation.json` as an unwired runtime path. That registry is control-plane evidence, not production runtime.

The canonical production-readback contract now classifies that exact registry path as verifier-only. The registry is also advanced with explicit revalidation evidence bound to terminalizer authority fixes #3812/#3822 and final migration-history closure #3824. Updating the registry intentionally retriggers the repository-owned historical reconciliation workflow on main.

Acceptance remains fail-closed: the new candidate must pass exact-HEAD gates, protected merge, the historical reconciliation workflow, and the post-merge terminalizer before #3741 is considered structurally reconciled.
