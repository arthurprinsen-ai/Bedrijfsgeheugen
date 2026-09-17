# GitHub Required Gate In-Progress Is Nonterminal v1

**Fingerprint:** `github-required-gate-in-progress-nonterminal-v1`

## Context

During Completion Supervisor PR #1805, exact candidate SHA `83c90ad11f2b296ffa785b59cbcb425c4bc3314f` had BRAIN delivery and the relevant supporting gates green while protected Required workflow run `35108350514` was still executing browser/readability verification. Browser job `104842004153` had already passed setup, high-risk full website regression contracts and affected-route desktop/mobile verification, while the remaining public-page visibility and header/readability steps were still in progress/pending.

A live-log read during the still-running job returned `BlobNotFound`. That is an observability timing condition: GitHub had not finalized the log blob yet. It is not evidence of a product/code failure.

## Failure mode to prevent

Agents can misclassify a healthy protected gate that is `queued`, `pending` or `in_progress` in two dangerous ways:

1. Treat it as a failure and change/restart code without concrete failure evidence, causing candidate churn and losing exact-head continuity.
2. Treat it as effectively complete and merge/bypass/report success before the protected context and post-merge evidence are actually green.

Both violate fail-closed delivery and Completion Supervisor semantics.

## Root cause

The status of external execution infrastructure was being conflated with product correctness. A protected CI gate may be healthy but unfinished. GitHub job execution, log finalization, product test result and production outcome are separate evidence classes and must remain separate.

## Proven handling

- Keep the exact candidate SHA immutable while Required is legitimately `queued`, `pending` or `in_progress`.
- Inspect workflow, job and step state to distinguish runner/execution progress from a test failure.
- Change code only after concrete failure evidence exists.
- Treat unavailable live logs before job completion as incomplete observability, not as a code defect.
- Preserve the same open Outcome Obligation / recovery lineage while external execution continues.
- Never bypass the protected `test` context.
- Merge only after the protected Required context succeeds for the exact current head SHA and the PR remains mergeable/current.
- Continue after merge through main readback, production/runtime verification, canonical writeback and learning before `LIVE_VERIFIED`.

## Prevention rule

`QUEUED`, `PENDING` and `IN_PROGRESS` protected gates are **nonterminal execution states**. They are neither failure nor completion. Do not mutate a healthy candidate merely to restart them; do not weaken or bypass the gate; do not close the obligation. Resume from the same exact identity when execution changes state.

A log endpoint returning `BlobNotFound` while its workflow job is still running is an observability-timing signal. It may only be escalated as an infrastructure defect if the job itself has terminated abnormally or the log remains unavailable after completion and the missing evidence is required for diagnosis/audit.

## Evidence

- PR: `#1805`
- Candidate SHA: `83c90ad11f2b296ffa785b59cbcb425c4bc3314f`
- Required workflow run: `35108350514`
- Browser job: `104842004153`
- BRAIN delivery run: `35108349978` — success
- Passed before the long-running visibility step: preflight, automation, portal, backend, syntax-preflight, preview-ready, baseline, static, page/SEO, high-risk full website regression, affected routes on desktop/mobile.
- Runtime learning registry: `brain_failure_registry.fingerprint = github-required-gate-in-progress-nonterminal-v1`, maturity `VALIDATED`.

## Reuse contract for agents

Before acting on an unfinished required GitHub gate:

1. Read current PR head SHA and protected branch requirements.
2. Read workflow → jobs → steps.
3. If there is no failed/cancelled/timed-out conclusion and a job is actively running or queued, preserve candidate identity and obligation state.
4. If a concrete test fails, diagnose its logs/artifacts and repair the root cause on the same candidate branch.
5. If the gate succeeds, proceed with exact-head protected merge and post-merge evidence.
6. Never report `LIVE & BEWEZEN` from candidate CI alone.

## Lifecycle

Current maturity is `VALIDATED`. Promote to `PROVEN` when this rule is enforced by an automated regression/contract test or equivalent Completion Supervisor policy check and that guard has itself passed protected CI and production/readback.