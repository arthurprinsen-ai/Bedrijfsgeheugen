# Immutable merged-PR terminalizer replay v1

## Problem

The #3890 terminalizer failed after protected merge because the quality-surface registry was misclassified as runtime. #3892 fixes that classifier on current main, but GitHub's ordinary workflow rerun remains bound to the original #3890 event SHA and would therefore execute the old broken terminalizer.

## Structural repair

The existing Powerhouse Obligation Terminalizer now supports one explicit marker on a later protected control-plane PR:

`Terminal-Replay-PR: <merged-pr-number>`

When present, the controller merge still executes the current trusted terminalizer code, but all lineage and production-readback inputs are resolved from exactly that already-merged target PR: body, head SHA, merge SHA and PR number.

The replay path:
- requires the target PR to be closed and actually merged;
- rejects self-reference;
- requires the target body to carry `Writer-Lease-State: TERMINAL_DELIVERY`;
- reuses the existing lineage validation, production/readback verification, learning projection and evidence materialization;
- writes evidence under the target PR number and records the controller PR separately;
- remains opt-in, so ordinary merged PRs continue through the existing path unchanged.

## Recovery target

This control-plane change carries `Terminal-Replay-PR: 3890`. After protected merge, the terminalizer therefore re-evaluates immutable #3890 using current fixed control-plane code and must emit terminal evidence for obligation `linkedin-company-fresh-org-oauth-terminal-20261006`.
