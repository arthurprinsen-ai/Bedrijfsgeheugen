# POWERHOUSE-ONE-LOOP-v1

Date: 2026-09-17
Status: Approved design

## Goal

Make every material Powerhouse change run through one canonical, durable, recoverable closed loop so agents/chats cannot leave work stranded as commits, open PRs, queued CI, stopped chats, timed-out runs, lost workers or unlearned incidents.

## Architectural decision

Extend the existing Brain/control-plane and POWERHOUSE-DELIVERY-HYGIENE-v1. Do not add a second brain, database, queue, scheduler, calendar, learning store or business-truth store. GitHub, Netlify, Supabase and agent/chat runtimes remain execution/telemetry surfaces; canonical orchestration and learning remain in the existing Powerhouse control-plane/Brain lineage.

## Canonical loop

intent/obligation -> existing-state preflight -> ownership/admission -> bounded execution -> tests/gates -> protected merge -> deploy/promote -> production readback/evidence -> outcome/value -> learning/writeback -> prevention/optimization -> fulfilled.

## Invariants

1. One obligation has at most one active executable candidate.
2. `committed`, `PR_OPEN`, `CI_QUEUED`, `TIMEOUT`, `CHAT_STOPPED`, `WORKER_LOST`, `LEASE_EXPIRED` and equivalent states are non-terminal recovery states.
3. Valid terminal states are `LIVE_PROVEN`, `FULFILLED`, or an externally proven `BLOCKED_EXTERNAL` state with a concrete recovery path. Repository-only completion is never sufficient.
4. Every material run is identity-bound by obligation, run, actor and exact candidate/head identity.
5. Every material run has durable checkpoint, heartbeat and lease semantics; expiry without valid terminal evidence triggers reconciliation/recovery.
6. Recovery is idempotent and must read back existing side effects before retrying.
7. New work is admitted only within delivery capacity. Finishing already-admitted work has priority over starting lower-priority work.
8. Security, integrity, truth, branch protection, release and evidence gates are never weakened for speed.
9. Failure fingerprints map repeated failures to canonical existing learning/recovery lineage before new analysis or duplicate obligations are created.
10. GitHub telemetry is a learning signal: queue duration, workflow duration, reruns, flaky failures, merge conflicts, supersession, moving-main churn, deploy latency and release outcome must feed the existing Powerhouse learning loop.
11. Learning that is operationally reusable should promote into executable prevention: regression tests, gates, guardrails, skills/instructions or recovery policy.
12. The system optimizes daily using measured throughput, latency, reliability, cost, security and outcome evidence; no improvement claim is accepted without measured evidence.

## Lifecycle

Canonical progression:

`DISCOVERED -> ADMITTED -> EXECUTING -> VERIFIED -> MERGE_READY -> MERGED -> DEPLOYED -> LIVE_PROVEN -> LEARNED -> FULFILLED`

Recoverable/non-terminal overlays include:

`WAITING_CAPACITY`, `CI_QUEUED`, `RETRYABLE_FAILURE`, `INTERRUPTED`, `CHAT_STOPPED`, `WORKER_LOST`, `LEASE_EXPIRED`, `SUPERSEDED`, `RECONCILING`.

`BLOCKED_EXTERNAL` is allowed only when the blocker is outside current technical authority, evidence is captured, already-tried remediation is recorded, and the minimum remaining action/recovery path is explicit.

## Completion Supervisor

Extend the existing completion/control-plane path with a single reconciliation function that:

- inspects all active material obligations;
- validates exact active candidate ownership;
- detects stale heartbeat/lease and incomplete execution;
- checks GitHub PR/check/merge state and deployment/readback evidence already captured by canonical integrations;
- resumes or creates one recovery continuation when technically possible;
- never creates duplicate active candidates;
- marks completed only after runtime evidence plus learning/writeback requirements are satisfied;
- records deterministic recovery evidence and failure fingerprints.

The supervisor must be safe to execute repeatedly.

## Finish-before-start admission

POWERHOUSE-DELIVERY-HYGIENE-v1 remains the repository admission authority and is extended with finishing pressure. When admitted executable work is waiting for CI, merge, deployment, runtime proof or learning closure, lower-priority new implementation candidates must be held in `WAITING_CAPACITY` when starting them would increase queue pressure. Security and incident recovery retain priority but never bypass gates.

## GitHub telemetry and learning

Existing GitHub execution metadata becomes canonical evidence input. At minimum capture/derive:

- PR created/updated/merged/closed timestamps;
- exact head/base identity and main movement;
- commits and changed-file scope;
- workflow/check queue, start and terminal timestamps when available;
- failure/retry/rerun signatures;
- mergeability/conflict state;
- supersession lineage;
- deployment/readback linkage;
- elapsed obligation-to-live and obligation-to-fulfilled time.

Metrics are evidence, not a new source of business truth.

## Daily optimization

A daily/autonomous improvement cycle reads the same canonical state and may propose or autonomously apply changes only within existing authority and gates. Focus areas: duplicate-work prevention, WIP, CI queueing, flaky tests, workflow fan-out, caching, build/test latency, deploy latency, recovery rate, architecture drift, dependency/security findings, Netlify/resource cost and front/backend runtime performance.

No optimization may weaken required evidence or security.

## Definition of Done

A material obligation is done only when:

1. one canonical candidate lineage exists and stale/superseded debris is reconciled;
2. exact-head required tests/gates are green;
3. protected merge is proven;
4. deploy/runtime state is read back where applicable;
5. production behavior/evidence matches intent;
6. outcome/value is captured when observable;
7. failure/root-cause/fix/prevention learning is canonically written back or verified as an idempotent no-op;
8. reusable prevention is promoted where warranted;
9. no technically-solvable known blocker remains.

## Rollback

Disable One Loop supervisor/admission extensions while retaining the existing delivery-hygiene, protected-main, completion, Brain and security controls. No rollback may delete canonical evidence or learning history.
