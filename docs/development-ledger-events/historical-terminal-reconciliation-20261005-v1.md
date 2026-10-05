# Development ledger — historical terminal reconciliation v1

- Date: 2026-10-05
- Obligation: historical-terminal-reconciliation-20261005-v1
- Source incident: PR #3741
- Forward authority correction: PR #3758
- Legacy terminalizer run superseded as authoritative evidence: 37343578647
- Stale Production Release Readback retained as non-authoritative historical state: 37343578411
- Exact historical merge SHA: 6a9452fa905073290c9274c2364d2aaaa52ad492

## Change

Introduces a fail-closed repository-owned reconciliation lane for historical merged obligations. The lane pins PR, obligation and merge identity, proves current-main containment, re-derives the original changed-path scope, applies the current production-readback authority, and emits superseding terminal evidence.

## Invariants

- Legacy hardcoded runtime/outcome booleans are never reused as proof.
- A stale workflow execution is evidence of historical execution state, not terminal authority.
- Runtime-not-applicable remains explicit and never masquerades as deployment, runtime-function or business-outcome proof.
- Historical runtime scope without a dedicated authority fails closed.
- Reconciliation evidence is exact-SHA bound and reproducible from repository history.
