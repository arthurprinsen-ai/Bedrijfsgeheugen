# Provider audit order fix

## Goal
Prevent the canonical content supervisor from erasing or replanning an existing delivery reference before provider truth has been audited.

## Root cause
The supervisor reconciled database state, then invoked the orchestrator, and only later invoked `powerhouse-social-publisher` in `audit_only` mode. If a delivery reference lacked fresh provider evidence, the orchestrator could replace the decision state before Buffer readback occurred.

## Required behavior
1. Reconcile canonical DB state.
2. Invoke `powerhouse-social-publisher` with `mode=audit_only` before any orchestrator call.
3. Only then allow orchestration/generation.
4. Dispatch, sync, audit again, reconcile post-state.
5. Existing verified provider delivery state must be preserved; missing provider state must become stale/blocked before replanning.

## Regression proof
`tests/brain-content-closed-loop-contract.test.mjs` asserts that the pre-orchestration provider audit invocation appears before the orchestrator invocation.
