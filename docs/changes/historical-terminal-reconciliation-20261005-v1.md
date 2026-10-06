# Historical terminal reconciliation v1

PR #3741 exposed two independent defects: a legacy terminalizer could emit fabricated runtime/outcome booleans, while its separate Production Release Readback could remain indefinitely in progress even when the change was a Supabase migration-history recovery with no runtime deployment authority.

PR #3758 corrected the forward path by routing production proof by runtime authority and by representing non-runtime or migration-history recovery as explicit not-applicable evidence. This change adds the missing backward-compatible reconciliation lane.

The lane is fail-closed. It only reconciles registry-pinned merged pull requests, validates the exact merge SHA and obligation identity, proves the merge is contained in current main, re-derives changed paths from Git history, and applies the current authority classification. Runtime changes without a wired authority are rejected.

Legacy workflow state is retained as historical evidence but is no longer authoritative. The superseding artifact records the stale run id and invalid legacy terminalizer run id explicitly, while never converting not-applicable proof into runtime-function or outcome proof.
