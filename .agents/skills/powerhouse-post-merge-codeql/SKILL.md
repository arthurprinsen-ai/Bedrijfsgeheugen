---
name: powerhouse-post-merge-codeql
description: Use whenever CodeQL or another post-merge security workflow is queued, running, superseded, cancelled, or completing on main during Bedrijfsgeheugen delivery.
---

# Powerhouse Post-Merge CodeQL

Fingerprint: `delivery|post-merge-codeql|single-flight-terminality|v1`.

## Non-negotiable contract

A post-merge CodeQL status is internal execution state, never a user handoff.

1. Bind security verification to the exact authoritative commit SHA.
2. For the same PR/ref, run CodeQL single-flight with a stable concurrency identity. Never use `github.run_id` in the concurrency group because that makes every run unique.
3. A newer run for the same ref supersedes stale queued/running work; cancellation of stale work is expected and must not be interpreted as a security failure for the newer SHA.
4. Only the newest relevant run for the exact authoritative SHA may decide security terminality.
5. Do not end a delivery response with “CodeQL is still running”, “security check pending”, or equivalent. Continue the same lineage until the authoritative run is terminal, unless a proven external hard boundary prevents autonomous progress.
6. A required CodeQL failure is repaired on the same obligation lineage, re-proved, protected-merged, and read back.
7. If CodeQL is explicitly non-required for a change because its path filter does not apply, record `NOT_APPLICABLE` from repository configuration rather than inventing a pending state.
8. LIVE_BEWEZEN still requires the existing exact-main production/provider readback. CodeQL does not replace production proof.

## Required repository shape

The canonical CodeQL workflow must use a stable key equivalent to:

`codeql-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}`

with `cancel-in-progress: true`.

## Recovery

When multiple CodeQL runs exist:
- identify exact main/head SHA;
- discard stale run authority;
- retain newest matching-SHA run;
- retry only if it failed/cancelled without a superseding healthy run;
- never fan out duplicate workflow attempts merely because the user sent another message.

## Completion vocabulary

Valid terminal states are:
- `SECURITY_GREEN`;
- `SECURITY_NOT_APPLICABLE` with path-filter evidence;
- `BLOCKED_HARD_BOUNDARY` with concrete external evidence.

Queued/running is not terminal.

## Client-stream interruption recovery

A ChatGPT/client transport interruption such as “Streaming onderbroken” is not a delivery terminal state and must never be interpreted as permission to abandon the obligation.

On the next executable turn:
- resume from the canonical PR/branch and newest exact head SHA;
- read current main and current workflow state before mutating anything;
- do not create a replacement PR merely because the previous response stream was interrupted;
- do not repeat a pending-status handoff; continue execution until the normal terminal contract is reached;
- distinguish UI/transport interruption from repository, CI, or production failure in the ledger and user-facing explanation.
