# Powerhouse Recovery Supervisor / automation-capacity learning

## Incident class

`recovery-watcher-slot-exhaustion-v1`

## Context

On 2026-09-17 the Powerhouse recovery process attempted to create another technical recovery watcher and hit the platform limit for active scheduled tasks. The immediate problem was not lack of recovery logic, but ownership fragmentation: separate incidents had accumulated separate watcher tasks even though they belonged to the same generic technical recovery responsibility.

## Root cause

Recovery ownership had been modeled per incident instead of per canonical recovery function. That allowed technically similar obligations such as queued GitHub delivery, interrupted execution, provider retry, timeout or lost-worker recovery to consume independent automation slots. The pattern conflicted with the One Loop principle of one canonical control-loop and created avoidable scheduler-capacity pressure.

## Canonical decision

The single generic owner is `Powerhouse Recovery Supervisor`. New technical recovery obligations MUST reuse this supervisor plus the existing canonical Powerhouse obligation registry. They MUST NOT create a new generic recovery/watch automation for each incident.

Specialist automations may continue only when they own a materially distinct recurring business function rather than generic recovery. Provider- or domain-specific recovery must remain attached to the canonical obligation and be consolidated into the supervisor when a separate watcher is no longer necessary.

## Permanent invariants

- exactly one generic Powerhouse recovery supervisor;
- no new generic watcher for PR queues, CI stalls, timeouts, stopped chats, lost workers, stale leases, provider retries or equivalent recoverable interruptions;
- one active owner per material obligation;
- reuse/update an existing owner before consuming a new automation slot;
- where technically possible keep at least one automation slot free for an explicit user-created reminder/task;
- queued/pending/in-progress work is a non-terminal WAIT/EXECUTING state and must not trigger retry/no-op commits or duplicate recovery jobs;
- stale/duplicate recovery watchers are consolidated and disabled when safe;
- protected merge, exact-head verification, runtime readback and learning writeback remain mandatory before FULFILLED;
- never weaken security, integrity, truth, privacy, branch protection, release or evidence gates to reclaim capacity.

## Evidence

- The attempted creation of an additional One Loop completion watcher returned the active-task capacity limit.
- Existing task inventory showed one current One Loop recovery watcher plus unrelated specialist business automations and several already-disabled historical recovery tasks.
- The existing One Loop watcher was repurposed in place as `Powerhouse Recovery Supervisor` rather than creating another task.
- Its contract now explicitly forbids additional generic recovery automations and requires reuse of the canonical obligation registry.

## Prevention fingerprint

`recovery-watcher-slot-exhaustion-v1`

Detection rule: before creating any future technical recovery automation, inspect existing Powerhouse recovery ownership. If the generic supervisor exists, update/reuse it. Creation of a second generic recovery watcher is a policy violation.

## Relationship to One Loop

This learning extends `powerhouse-one-loop-v1` and `stranded-delivery-or-interrupted-execution-v1`. Scheduler capacity is part of the same control-plane: recovery state belongs in canonical obligations, not in a growing set of independent watcher tasks.

## Completion rule

Documentation or scheduler mutation alone is not LIVE_PROVEN. This prevention rule becomes fully closed only when the current One Loop delivery reaches protected merge, main/runtime readback and canonical learning closure. Until then the rule is active implementation evidence and must still be obeyed.
