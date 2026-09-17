# Powerhouse Delivery Kernel / One Loop v2 Design

## Goal
Allow 10+ chats/agents to develop concurrently while serializing only the smallest conflicting integration/merge/deploy surface. Remove orchestration-created blocking without weakening security, integrity, truth, protected-main, release or production-evidence gates.

## Existing authority
This extends `POWERHOUSE-ONE-LOOP-v1`, `POWERHOUSE-DELIVERY-HYGIENE-v1` and `BRAIN-DELIVERY-v2`. It does not create a second brain, queue, scheduler, database, calendar or learning store. PR #1968 remains the canonical candidate.

## Root cause
The repository already has change-scoped Required lanes, but one PR can still fan out into multiple additional pull-request workflows. At the same time delivery WIP had been interpreted as a cap on open executable PRs, throttling independent development rather than scarce integration capacity. Queue states were nonterminal but lacked a bounded stale-reconciliation transition.

## Architecture
1. Intake/admission remains `powerhouse-delivery-hygiene` with one obligation and one active executable candidate.
2. Development concurrency is independent from integration pressure. Unique non-conflicting implementation candidates are not blocked by integration WIP.
3. Finishing work (`recovery`, `promotion`, merge/deploy/readback critical sections) keeps finish-before-start priority.
4. `required-test.yml` remains the single PR-required orchestration authority and delegates selected domain lanes.
5. Other workflows are required-child, main-only, scheduled-observability, manual-recovery or narrowly change-scoped PR checks. Broad duplicate PR fan-out is forbidden.
6. GitHub queued/in-progress is recoverable. A bounded stale threshold triggers reconciliation/readback before any retry.
7. Generic CodeQL PR analysis is Python-scoped; Powerhouse CodeQL is the JavaScript/TypeScript PR authority. Main/scheduled scans remain intact.
8. Moving main revalidates only affected conflict domains. Exact-head identity and protected merge remain mandatory.
9. Completion remains merge -> deploy/promote -> exact production readback -> outcome -> learning/writeback -> fulfilled.

## Recovery semantics
A run identity is `{obligation_id, candidate_sha, domain, generation}`. A newer generation supersedes stale queued/in-progress work for the same obligation/domain. Queue timeout is not success or external blocker; it becomes `RECOVER` and must read current side effects/state before retry. Deterministic code/test failures remain red. Transient infrastructure failures may use bounded retry.

## Workflow budget
`config/powerhouse-pr-workflow-budget-v1.json` is the machine-readable regression authority for PR orchestration. It records the canonical required orchestrator, allowed narrow exceptions, queue policy and SLOs. Tests prevent reintroduction of broad duplicate heavy PR workflows.

## SLOs
- Admission target: <30s.
- Queue-to-start target: <60s when GitHub capacity is available.
- No duplicate heavy run for the same `{obligation, sha, domain}`.
- Stale queue reconciliation target: <=2 minutes after threshold detection.
- Moving main without relevant domain overlap: no domain retest.
- Recoverable interruption: no manual cleanup requirement.
- Track `obligation_to_live_ms` and `obligation_to_fulfilled_ms`.

## Rollout
Incremental and fail-closed: regression tests -> development/integration WIP separation -> stale queue recovery -> duplicate CodeQL scoping -> workflow-budget authority -> exact-head CI evidence -> protected merge/readback. Existing gates are narrowed or retired only after equivalent authority is proven.
