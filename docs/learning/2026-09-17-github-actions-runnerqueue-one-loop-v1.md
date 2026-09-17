# GitHub Actions runner queue / One Loop recovery v1

Date: 2026-09-17  
Fingerprint: `github-actions-runnerqueue-nonterminal-one-loop-v1`  
Obligation: `powerhouse-one-loop-v1`  
Canonical candidate: PR #1968  
Recovery candidate: PR #1970  
Status: CANONICAL LEARNING — OPEN UNTIL #1968 FULL CLOSURE

## Context

PR #1968 implements the Powerhouse One Loop control-plane. During delivery it entered `WAITING_CAPACITY / FINISH_EXISTING_WORK_FIRST` because recovery candidate #1970 still owned the finishing slot. That state was initially easy to misread as generic CI or GitHub-hosted-runner blockage.

The correct interpretation was different: finish-before-start was working as designed. #1970 had to be completed on its own canonical lineage before #1968 could be admitted again. Old CI runs and old candidate SHAs were never valid promotion evidence once a newer exact head existed.

## Incident sequence

1. #1968 was held by the existing finish-before-start admission rule while #1970 was the live recovery candidate.
2. #1970 exact-head `a4bf8eedfe7243805aeb44894644a3180c0bfad9` showed two red gates: `BRAIN delivery` and `Required test`.
3. Both failures reduced to the same deterministic test-oracle defect. The approved-blog refactor had moved implementation into `scripts/brain/publish_approved_blog_v2_core.py`, while `tests/brain-change-scoped-release-lanes.test.mjs` still searched implementation symbols such as `faq_items` and `source_contract` in the thin `scripts/publish_approved_blog_v2.py` wrapper.
4. The recovery stayed on the same #1970 branch/PR. The test oracle was corrected at the canonical implementation boundary without broad opportunistic changes.
5. On exact-head `c94c2226412681fa0a6a21532b4ef3c9237002ca`, both `Required test` and `BRAIN delivery` reached terminal SUCCESS.
6. #1970 was protected-merged with expected-head identity. Merge/main readback produced `b573a31d0547979bf9c708e4f56da0fa27502688`.
7. After the recovery merge, #1968 was admitted again automatically by the existing hygiene/admission rule. On a later observed exact-head `2a5a74bf4b31030223cc0f2e7fb532edda25b605`, `hygiene / admission` was SUCCESS and preflight started.
8. During later iterations, a Required attempt correctly failed closed with `PR_HEAD_SHA_DRIFT` when the live PR head had already moved. That old attempt was discarded as promotion authority instead of being repaired or retried blindly.
9. Main and #1968 continued to advance after this evidence. Therefore every future action must reread current main, current PR metadata and current candidate head before using the concrete SHAs above for anything other than historical evidence.

## Root causes

### 1. Admission state misclassified as CI blockage

`WAITING_CAPACITY / FINISH_EXISTING_WORK_FIRST` is not a terminal external blocker. When another valid recovery owns the finishing slot, it is an intentional recoverable state.

### 2. Stale test oracle after implementation-boundary refactor

The implementation moved from a wrapper into a core module, but a test continued to inspect the wrapper as though it still contained implementation details. Product behavior was not the root cause; the test oracle was stale.

### 3. Stale run mistaken for current truth risk

Multiple heads were created while diagnosis and recovery were active. A CI result belongs only to the SHA it executed. Once the PR head moves, the older run can be retained as historical evidence but cannot authorize repair, promotion or merge.

### 4. Delivery metadata can drift after legitimate lineage movement

Recovery merges and main advancement can change the current integration base. Identity/admission metadata must be reconciled with the current lineage while preserving fail-closed exact-head semantics. The response to legitimate drift is not to weaken hygiene gates.

## Permanent prevention rules

- `EXACT_HEAD_EVIDENCE_ONLY`: only the current PR head can authorize current repair, promotion or protected merge.
- `STALE_RUNS_ARE_HISTORICAL_ONLY`: old SHA failures are never repaired after the candidate has moved unless the same defect reproduces on the new exact head.
- `FINISH_BEFORE_START_IS_RECOVERABLE_FLOW_CONTROL`: a finishing recovery candidate is completed or deterministically superseded; admission is never bypassed just to make another PR run.
- `FIRST_CONCRETE_ASSERTION_OWNS_THE_REPAIR`: inspect the failing exact-head job/annotation and repair only the first proven contract break before considering broader changes.
- `TEST_THE_CANONICAL_IMPLEMENTATION_BOUNDARY`: after a wrapper/core refactor, implementation assertions follow the core; wrapper tests assert only delegation/interface behavior.
- `PR_HEAD_SHA_DRIFT_FAILS_CLOSED`: head movement during a run invalidates that run as current promotion authority.
- `REREAD_AFTER_MAIN_MOVEMENT`: after any recovery merge or protected-main movement, reread main SHA, candidate SHA, PR metadata, mergeability and workflow state before acting.
- `NO_PARALLEL_RECOVERY_LINEAGE`: recovery remains on the existing canonical PR/branch unless a genuinely external constraint makes that impossible.
- `PROTECTED_MERGE_REQUIRES_EXPECTED_HEAD`: merge only after all required current-head gates are terminal green and the merge call is guarded by the expected head SHA.
- `WRITEBACK_IS_PART_OF_DEFINITION_OF_DONE`: incident, root cause, evidence, prevention and remaining obligation are written back to the same Powerhouse learning lineage.

## Evidence

Historical evidence captured in this incident:

- #1970 failing head: `a4bf8eedfe7243805aeb44894644a3180c0bfad9`;
- #1970 proven green head: `c94c2226412681fa0a6a21532b4ef3c9237002ca`;
- #1970 protected merge/main SHA: `b573a31d0547979bf9c708e4f56da0fa27502688`;
- post-recovery #1968 admission observed green on `2a5a74bf4b31030223cc0f2e7fb532edda25b605`;
- machine-readable source of truth: `brain/learning/2026-09-17-powerhouse-one-loop-v1.json`.

These SHAs are immutable incident evidence, not a substitute for rereading the current candidate.

## Current obligation

This writeback closes the documentation gap for the #1970 recovery and #1968 re-admission sequence. It does **not** declare the overall `powerhouse-one-loop-v1` obligation complete while #1968 remains open or current exact-head gates, protected promotion/merge, main/production readback and final closure evidence are still outstanding.

The terminal status for the overall obligation remains `IMPLEMENTING` until the active exact-head lineage itself proves the complete Definition of Done.
