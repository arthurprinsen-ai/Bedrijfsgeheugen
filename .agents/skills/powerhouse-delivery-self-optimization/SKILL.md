---
name: powerhouse-delivery-self-optimization
description: Use when optimizing Powerhouse delivery for first-time-right execution, proactive failure prevention, low-friction parallel delivery, and terminal proof without avoidable retries.
---

# Powerhouse Delivery Self-Optimization

Fingerprint: `delivery|first-time-right|terminal-preflight|v1`.

## Purpose

Make the delivery system predict likely failure modes before they happen. Optimize for fewer avoidable retries, stale-head reconciliations, merge conflicts, queue churn and incomplete delivery while preserving exact-head gates, protected merge and production readback.

## Anticipate-before-act contract

Before every material write, reconcile, retry, merge or promote step:

1. Refresh current `main`, current PR head, merge-base, ahead/behind, mergeability and active workflow state.
2. Build a short failure forecast for the next delivery horizon:
   - main likely to move before merge;
   - overlapping open PR/writer-lease scope;
   - hot shared surfaces;
   - missing workflow/classifier coverage;
   - metadata/admission mismatch;
   - scheduler/capacity risk;
   - post-merge deploy/readback dependency;
   - learning/skill projection still required.
3. Choose the narrowest action that minimizes expected rework while preserving all safety invariants.
4. Re-read authoritative state immediately before any irreversible action. Never act on cached mergeability, cached head or old CI evidence.
5. After state movement, re-plan from the new epoch instead of replaying an old plan.

## First-time-right rules

- Validate the PR delivery envelope with the same canonical parser and allowed-value policy used by admission before expensive CI starts.
- Require `Obligation-ID`, `Delivery-Lane`, `Candidate-Type`, `Base-SHA`, and the full writer-lease tuple when terminal delivery is active.
- Every new executable test must have workflow/classifier coverage in the same candidate.
- Preflight the candidate contract against the regression assertions that will judge it; schema/test drift must be found before remote CI.
- A cancelled GitHub job without a concrete failing assertion is scheduler/concurrency recovery input, not evidence that product code is wrong.
- Retry only the missing cancelled job on the same exact head before considering code mutation.
- Inspect main drift and shared-surface overlap before reconciliation; preserve the full current-main union and keep the same obligation/PR lineage.
- Prefer a dedicated skill/projection over editing a concurrently owned hot shared skill when the knowledge can be represented without changing authority.
- Never spawn a duplicate PR merely because main moved. Reconcile or rebuild the same obligation lineage from fresh main according to the writer-lease/supersession policy.
- Green evidence belongs to an exact head. Reuse it only when the exact candidate identity and applicable gate contract remain unchanged.
- Plan terminal delivery all the way through protected merge, deploy/readback, outcome evidence and learning/skill writeback before starting the mutation.

## Predictive telemetry

Track per obligation:

- `metadata_admission_reject_count`
- `orphan_test_preflight_count`
- `scheduler_cancel_retry_count`
- `main_epoch_reconcile_count`
- `shared_surface_overlap_count`
- `hot_surface_avoidance_count`
- `green_gate_reuse_ratio`
- `time_to_terminal_proof`
- `stale_state_prevented_count`
- `predicted_collision_avoided_count`
- `pre_ci_contract_defect_count`
- `duplicate_lineage_prevented_count`

Repeated friction is a generator/template/scheduling defect to eliminate, not normal noise. Prediction quality must itself be calibrated: record predicted failure modes, observed outcomes, false positives and misses, then tighten the planning rule.

## Decision rule

Use the narrowest safe repair:
- metadata reject -> repair metadata/template;
- orphan test -> add workflow/classifier coverage;
- stale test/schema expectation -> align implementation and contract before CI;
- cancelled job without assertion -> retry the missing job;
- main moved -> refresh, forecast and reconcile same lineage;
- merge-base diverged materially -> rebuild only the obligation delta from fresh main and supersede stale lineage;
- hot shared surface -> avoid it when a dedicated projection can carry the knowledge;
- concrete failing assertion -> repair only that root cause;
- post-merge/readback dependency missing -> keep ownership and continue terminal delivery, never return it as user follow-up.

## Agent behavior

The agent is expected to think one or more state transitions ahead. It must ask: “what is most likely to invalidate this candidate next?” and remove that preventable cause before spending another CI/deploy cycle. Reactive recovery remains the fallback; proactive prevention is the default.
