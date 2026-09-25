# Development ledger — trigger-aware terminal gate applicability

Date: 2026-09-25
Obligation: `governance-production-trigger-ownership-v1`
Supersedes: PR #3108 terminal-closure deadlock

## Failure
Terminal closure run `36175492847` was stuck waiting for Unified Brain Delivery with `event=pull_request`.

## Root cause
`unified-brain-delivery.yml` is workflow_dispatch-only; the terminalizer was polling an event that can never be emitted.

## Repair
The terminalizer derives event applicability from the workflow trigger definition. A workflow without a PR trigger is explicitly `NOT_APPLICABLE`; all actual gates remain fail-closed.

## Prevention
Brain regression coverage enforces `TERMINAL_GATE_MUST_VALIDATE_EVENT_APPLICABILITY_BEFORE_POLLING`.
