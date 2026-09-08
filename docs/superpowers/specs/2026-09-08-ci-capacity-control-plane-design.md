# CI Capacity Control Plane Design

Date: 2026-09-08
Repository: `arthurprinsen-ai/Bedrijfsgeheugen`
Status: Proposed design approved in chat; implementation not started

## Problem

The repository currently starts many independent GitHub Actions workflows for a single pull-request commit. On PR #1159 (`Fix homepage hero video autoplay recovery`), the same head SHA started a large set of unrelated or only loosely related workflows, while the required delivery path waited in the queue. The observed failure mode is runner-capacity starvation and workflow fan-out, not a bad `runs-on` value and not a defect in the homepage change itself.

A correct solution must preserve branch protection and quality gates while preventing obsolete, irrelevant, duplicate or low-priority work from consuming capacity needed by current release-critical work.

## Goals

1. A PR should start one primary orchestration flow, not an uncontrolled set of independent repository-wide workflows.
2. Only delivery lanes relevant to the changed files should consume runners.
3. Superseded work for the same PR/change family should be cancelled automatically.
4. Required checks must remain stable and branch-protection compatible.
5. Independent PRs must remain able to develop, test and release in parallel.
6. Release/deploy/readback capacity must not be starved by diagnostics, learning tests or unrelated repository checks.
7. Queue starvation must be detectable as an operational incident.
8. The CI architecture itself must be regression-tested.
9. No quality gate may be silently skipped merely to reduce runner use.
10. Completion remains a closed loop: classify -> test -> merge -> deploy -> live readback -> evidence -> learning.

## Non-goals

- Buying more runner capacity as the primary fix.
- Disabling branch protection.
- Making all repository work globally serial.
- Removing substantive quality controls.
- Treating manual cancellation of old runs as the permanent operating model.

## Architecture

### 1. Single PR orchestrator

Introduce one canonical PR workflow that owns `pull_request` orchestration. Its first job is a lightweight classifier/preflight. The classifier evaluates changed paths and emits explicit lane booleans, for example:

- `website`
- `portal`
- `backend`
- `automation`
- `brain-compliance`
- `release-control-plane`

Other PR workflows should no longer independently trigger broad runner-consuming work for every PR. They either become reusable workflows called by the orchestrator or are restricted to narrow triggers that cannot duplicate the primary PR path.

### 2. Path-based lane selection

The classifier maps changed files to delivery lanes. A website-only change runs website checks; a backend-only change runs backend checks; cross-domain changes run all affected lanes.

Classification is fail-safe: unknown or control-plane-sensitive changes widen coverage rather than narrow it. Changes to workflow files, shared scripts, dependency manifests, release tooling or shared contracts trigger the conservative lane set required to prove the control plane remains safe.

### 3. Required-test aggregator

`Required test` becomes the stable branch-protection contract. It does not duplicate all tests itself. Instead it:

1. runs preflight/classification;
2. dispatches only relevant reusable lane workflows/jobs;
3. waits for the selected lane results;
4. returns success only when every required selected lane succeeds or is explicitly classified as not applicable.

The required check name remains stable so branch protection does not need to track many volatile job names.

### 4. Concurrency and supersession

Every PR-scoped workflow/job family uses a deterministic concurrency key containing at least repository, PR number and lane/change family.

For PR validation, `cancel-in-progress: true` is the default. When a newer SHA arrives for the same PR and lane, older queued or running work is cancelled automatically.

Production deployments use a separate concurrency group. They may serialize only where the deployment target itself requires serialization; they must not share a concurrency group with ordinary PR validation.

### 5. Cheap-first execution

Execution order:

1. metadata-only classification;
2. syntax/config/contract checks;
3. focused unit/static tests;
4. build/integration tests;
5. browser/full-build checks;
6. deployment/readback after merge where applicable.

Expensive jobs should depend on cheaper gates when doing so avoids wasting runner time on a change already proven invalid.

### 6. Release-critical lane isolation

Release/deploy/live-readback work gets its own concurrency namespace and must not wait behind unrelated diagnostics or learning jobs solely because those jobs were triggered by the same commit.

Diagnostic workflows remain useful but should be event-driven, manually invoked, scheduled, or called only after a relevant failure. A diagnostic should not compete with the check it is supposed to diagnose.

### 7. Stale-work policy

A run is stale when a newer commit for the same PR/change family supersedes it and its result can no longer satisfy the branch-protection decision for the current head.

Stale PR validation work is automatically cancelled via concurrency. No repeated manual reruns are generated while capacity is constrained.

Long-running current-head work is not cancelled merely because it is slow. Staleness is based on supersession, not elapsed time alone.

### 8. Queue watchdog and SLO

Add a lightweight queue-health monitor that detects current-head release-critical jobs that remain queued beyond a defined threshold without executing steps.

The monitor must distinguish:

- current-head starvation;
- stale queued work;
- GitHub-wide incidents;
- repository-owned fan-out/capacity pressure.

It records evidence and opens/escalates one deduplicated operational signal rather than repeatedly creating queue noise.

Initial operational SLO: PR preflight should obtain runner capacity promptly; any current-head required preflight/classifier that remains queued without starting beyond the agreed threshold is a CI incident.

### 9. Status bridges

Compatibility/status-bridge workflows must not consume a separate runner merely to mirror a result already available from the canonical orchestrator when a job/output/status expression can provide the same branch-protection contract.

Any retained bridge must have an explicit reason and prove it cannot create an independent fan-out chain.

### 10. Parallel-development contract

Concurrency keys are scoped narrowly. Different PRs and different independent delivery lanes may run concurrently.

The design expressly forbids repository-global concurrency locks for normal development. One blocked or failing PR may not prevent another independent, green PR from reaching production.

### 11. Failure semantics

- Unknown classification: fail conservative / run broader coverage.
- Classifier failure: fail `Required test`; do not guess.
- Selected lane failure: fail `Required test`.
- Non-selected lane: represented as explicitly not applicable, not silently absent.
- GitHub/platform outage: report external blocker; do not mutate code to chase platform symptoms.
- Capacity starvation: surface as CI operational incident; do not generate repeated reruns.

## Workflow ownership model

The intended end state is:

- one canonical PR orchestrator;
- reusable lane workflows/jobs for website, portal, backend, automation and brain/compliance;
- separate post-merge production promotion/readback workflows;
- diagnostics triggered only when relevant;
- scheduled/manual maintenance workflows outside the PR fast path;
- one stable required branch-protection contract.

## Migration strategy

### Phase 1 - Inventory and classification

Inventory every workflow that currently reacts to PR activity and classify it as:

- canonical required lane;
- reusable supporting lane;
- diagnostic;
- post-merge/release;
- scheduled/manual maintenance;
- redundant/bridge candidate.

### Phase 2 - Add orchestrator without weakening gates

Create the classifier and canonical aggregator while preserving existing substantive checks. Initially compare orchestrated results with the existing workflow set.

### Phase 3 - Move lanes behind reusable calls

Convert broad independent PR workflows into reusable workflows or narrowly triggered jobs. Add per-PR/lane concurrency groups with automatic supersession.

### Phase 4 - Remove duplicate PR triggers

Only after equivalence is proven, remove the duplicate broad `pull_request` triggers and redundant status bridges.

### Phase 5 - Add queue-health guardrails

Add queue-SLO monitoring, stale-work evidence and regression checks for the CI control plane.

## Test strategy

The implementation must include automated tests that validate at least:

1. exactly one canonical broad PR orchestrator exists;
2. lane mapping for representative website, portal, backend, automation and mixed changes;
3. unknown/shared-control-plane changes widen coverage;
4. concurrency keys include PR/change family and use supersession for PR validation;
5. production concurrency is isolated from PR validation;
6. expensive jobs cannot start before their prerequisite cheap gates when dependencies are intended;
7. no retained broad PR workflow duplicates a canonical lane;
8. `Required test` succeeds only if every selected lane is green or explicitly not applicable;
9. a superseded SHA cannot later become the branch-protection decision for the current PR head;
10. independent PRs do not share a global lock;
11. queue-health detection deduplicates incidents and does not create retry storms.

## Acceptance criteria

The change is complete only when all of the following are true:

1. A representative website-only PR triggers the canonical orchestrator and only relevant runner-consuming lanes.
2. A newer commit on the same PR automatically supersedes older PR validation work.
3. `Required test` remains the branch-protection contract and reaches a terminal state based on current-head evidence.
4. Independent PRs can execute concurrently.
5. Production promotion/readback cannot be starved by unrelated PR diagnostics through a shared concurrency group.
6. No substantive existing quality gate is lost; every removed broad trigger is replaced by an equivalent routed invocation or proven redundant behavior.
7. A CI architecture regression test prevents reintroduction of uncontrolled PR workflow fan-out.
8. Live evidence shows a materially lower number of runner-consuming workflows for a focused PR than the pre-change baseline observed on PR #1159.
9. Post-merge deployment and live readback still execute on the exact merged SHA.
10. The resulting operational learning is written back to the repository/Bedrijfsgeheugen governance path used for release-system learnings.

## Rollback

The migration is reversible per phase. Until the orchestrated path proves equivalence, old gates are not removed. If the new orchestrator misclassifies changes or produces unstable required status, restore the previous trigger set while retaining collected evidence and regression tests, then correct the classifier before attempting the migration again.

## Key design decision

The repository will solve capacity starvation primarily by controlling CI demand: reduce duplicate fan-out, route by materiality, supersede obsolete work and isolate release-critical capacity. Additional runner capacity may be added later for throughput, but it is not a substitute for a correct orchestration model.
