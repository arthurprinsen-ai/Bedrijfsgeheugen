# Same-workflow original innovation intake recovery — 15 November 2026

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Problem evidence
Today's original daily self-evolution workflow run ID 43706613811 started at 10:58 UTC before original Innovation PR #5847 merged into main at 11:17 UTC. The existing protected daily admission code correctly rejects any subsequent same-day `schedule` or plain `workflow_dispatch` re-execution. The new source-bound `INNOVATION_INTAKE` pre-review could not execute today through a normal full workflow without breaking the once-per-day rule.

## Minimal single-source recovery mode
In the **same existing** workflow file `.github/workflows/powerhouse-daily-self-evolution.yml` introduce typed `workflow_dispatch.inputs.execution_scope` with `daily` default or explicitly requested `original_intake_recovery`.
- Normal `schedule` and `daily` runs stay bound to the original `daily-learning-run-admission.mjs`; duplicated normal runs still fail visibly (exit code 78). Neither daily `improve` nor `model-freshness` is weakened.
- Only manual `original_intake_recovery` skips the full daily jobs and executes the **same original** `innovation-original-owner-readback.mjs` and `innovation-original-agent-pre-review.mjs --writeback`, with their original tests, secrets and original CAS/idempotency/owner/source policy, inside the workflow's pre-existing concurrency group. No automatic trigger, new external scheduler, data queue, publisher or separate source of truth.
- This is *review-only*: original operation remains PLANNED, no external side effect, no consumer ACK, no verified innovation, no Heartbeat outcome. An original Engineering/CRO agent must still perform an authorized, reversibly protected implementation and independent effect validation before the old obligation can be closed.

## Acceptance and control
Test `tests/brain-original-innovation-same-workflow-resume-20261115.test.mjs` enforces the normal daily run fence, manual-only typed recovery, shared original workflow, original audit and native CAS, sanitized artifact, no bypass of terminal evidence. Exact protected CI/CodeQL and same source main merge are required; then dispatch exactly once and read back independent provider run + original operation review SHA/owner. If scope is unknown or token absent: fail closed and preserve original OPEN obligations.

Rollback uses protected revert of this same workflow and skill/agent task; original data and historical events are immutable.
