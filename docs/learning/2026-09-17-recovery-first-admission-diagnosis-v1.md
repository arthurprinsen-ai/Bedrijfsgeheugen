# Recovery-first admission diagnosis v1

Date: 2026-09-17
Obligation: `powerhouse-one-loop-v1`
Canonical candidate: PR #1968
Related recovery: PR #1970

## What happened

PR #1968 entered `WAITING_CAPACITY / FINISH_EXISTING_WORK_FIRST`. At first sight this could be mistaken for GitHub runner pressure or a generic CI blockage. Current-state inspection showed that the admission controller was intentionally yielding to the live recovery candidate PR #1970 (`approved-blog-stale-reconciliation-v1`).

The correct recovery path was therefore not to weaken `finish-before-start`, increase WIP, create another PR, or blindly rerun old CI. The correct path was to finish the existing recovery candidate, then reread current main, the exact candidate head and current workflow state before taking another action.

## Evidence

- PR #1970 is merged.
- Recovery merge commit: `b573a31d0547979bf9c708e4f56da0fa27502688`.
- Current main readback after follow-up learning: `5e9ae9f2633ffb1b0bdd07c2ba8b44b934d927b9`.
- Follow-up learning PR #1975 is merged on main.
- PR #1968 remains the single canonical One Loop candidate and is mergeable on the current lineage.

## Root cause

The underlying control was behaving as designed: recovery work has priority over ordinary implementation work under finish-before-start pressure. The operational failure mode is misclassification. A deliberate admission wait can be mistaken for CI/runner failure, which can trigger harmful actions such as unnecessary reruns, no-op commits, admission bypasses, WIP increases or parallel corrective branches.

## Permanent prevention rule

Before changing code, workflow configuration or runner capacity for a blocked candidate, classify the blocker into exactly one current-state category: admission/ownership, deterministic exact-head test failure, transient runner/platform failure, stale or superseded run, or external dependency.

When `FINISH_EXISTING_WORK_FIRST` is caused by a live recovery candidate, finish or deterministically supersede that recovery first. Never bypass the admission contract merely to make another candidate run. After any recovery merge or main movement, reread current main, current candidate head and current workflow state. Historical red jobs are diagnostic evidence only; they are not repair authority after the lineage moved.

For a real current failure, inspect the exact-head run, isolate the first concrete assertion or contract violation and repair only that cause on the same canonical branch/PR. Do not create a parallel recovery candidate for the same obligation.

## Reusable fingerprints

- `recovery-first-admission-misread-as-ci-blockage-v1`
- `stale-run-repair-authority-v1`

## Expected behavior from now on

A blocked agent/chat must first resolve whether the block is intentional admission pressure or an actual failing dependency. Recoverable internal waits remain active work, not terminal `GEBLOKKEERD`. External dependencies may be `BLOCKED_EXTERNAL`, but must retain durable state and resume from the last proven checkpoint when the dependency clears.

This learning belongs to the same `powerhouse-one-loop-v1` lineage and does not introduce another queue, scheduler, learning store or delivery truth.
