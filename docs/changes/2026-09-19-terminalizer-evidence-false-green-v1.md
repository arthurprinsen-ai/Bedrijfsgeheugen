# Terminal evidence false-green closure

Obligation-ID: `github-terminalizer-evidence-false-green-v1`  
Fingerprint: `github|terminalizer|evidence-all-checks-required-v1`

## Incident

PR #2419 successfully fixed squash-merge lineage detection and its terminalizer validated the merged lineage, production promotion and learning/skill projection. However the emitted terminal evidence still contained `merged_lineage_verified=false` while the workflow concluded success and labeled the record `LIVE_BEWEZEN`.

## Root cause

The shell step wrote `LINEAGE_MODE` to `$GITHUB_ENV` and then invoked Node in that same step. GitHub applies `$GITHUB_ENV` values to subsequent steps, so the Node process recorded `unknown`. The final materializer then checked only learning projection instead of requiring every terminal evidence flag to be true.

## Fix

- pass `LINEAGE_MODE="$lineage_mode"` directly to the same-step Node process;
- calculate the complete terminal check map first;
- fail with `TERMINAL_EVIDENCE_NOT_PROVEN` if any required check is false;
- assign `LIVE_BEWEZEN` only after that fail-closed validation;
- persist the proven lineage mode in final terminal evidence.

This converts workflow success from a proxy into machine-verifiable terminal truth.
