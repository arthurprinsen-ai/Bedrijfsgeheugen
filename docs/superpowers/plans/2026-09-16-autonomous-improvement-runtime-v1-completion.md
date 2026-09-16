# Autonomous Improvement Runtime v1 — TDD Execution Plan

Date: 2026-09-16
Spec: `docs/superpowers/specs/2026-09-16-autonomous-improvement-runtime-v1-completion.md`
Target: `LIVE & BEWEZEN`

## 1. Establish executable lifecycle contract

RED: add a test importing the not-yet-existing completion runtime and assert obligation identity/resume, sequential lifecycle, evidence gates, scheduler provenance, autonomy boundaries, causal-value classification and meta-learning.

GREEN: implement only pure reusable completion primitives in `scripts/brain/continuous-improvement/completion-runtime.mjs`.

VERIFY: `node tests/brain-autonomous-improvement-runtime-completion.test.mjs`.

## 2. Bind replay and safe chaos to canonical production data

Implement a Supabase executor over existing `brain_failure_occurrences` and `brain_obligations`. Counterfactual replay compares champion and challenger windows, requires minimum sample and preservation of material failure fingerprints. Execute six synthetic isolated failure scenarios and require recovery/idempotency/consistency evidence.

VERIFY: Supabase migration security contract, hosted PR preview contract, completion gate and backend lane.

## 3. Make promotion real and reversible

Write promoted low-risk policy into existing Brain `Decision` records. Future cycles must read the last promoted policy as their champion. Production verification reads the exact policy record/value back. Rollback is the prior promoted value; no destructive change is needed.

VERIFY: exact record/value readback, no browser execution privileges, no direct promotion across hard boundaries.

## 4. Persist value and learning without overstating causality

Write observed operational delta in existing Brain learning lineage. Never convert scan-work deltas to revenue. Mark causal claim false unless a qualifying experimental design exists. Record hypothesis class, executor, sample, result, operational value and scheduler provenance.

VERIFY: learning record readback and obligation lifecycle `LEARNED`.

## 5. Reuse the existing daily Quality Intelligence scheduler

Generate a live capability inventory from repository/runtime surfaces. Extend primary-source discovery to current platform/model/database/testing/security sources. Filter discoveries against active inventory domains. Emit only benchmark/replay/challenger candidates; never auto-adopt.

VERIFY: scheduled Quality Intelligence workflow and its uploaded enriched innovation-scout artifact.

## 6. Prove natural scheduler invocation

Upgrade the existing `powerhouse-autonomous-improvement-cycle-v1` job command to a wrapper; do not create another cron job. The wrapper resolves its own `cron.job_run_details.runid`, runs the existing v1 cycle, then invokes completion execution with `pg_cron` provenance.

VERIFY: a natural run at minute `:42` has matching runid and sets `scheduler_proven=true`. Manual execution must never set it true.

## 7. Expose executive control projection

Create a service-role-only security-invoker view over existing obligations. Include lifecycle, blocker, replay/chaos evidence, promotion/readback, value, learning id, scheduler proof, change id and version.

VERIFY: Supabase security gate plus direct readback with service authority.

## 8. Delivery and production

Open PR through BRAIN-DELIVERY-v2/BG169. Fix all relevant gates; reconcile moving-main drift according to existing branch policy. Merge only an exact tested SHA. Allow existing production migration path to deploy. Verify functions, scheduler command, control view, obligation/Brain records and exact production SHA/state.

## 9. Final acceptance run

Do not label broader completion `LIVE & BEWEZEN` until one natural scheduled cycle autonomously completes:

`candidate → obligation → replay/experiment → evidence → controlled promote/rollback → production readback → value → learning writeback`.

If evidence is insufficient, keep the same obligation active/blocked with exact reason and automatic resume. This is an active recovery state, not resolved completion.

## Regression/prevention

- Completion lifecycle test remains required for touched runtime paths.
- Supabase security and preview gates remain fail-closed.
- BRAIN delivery classifies tests under canonical `tests/brain-*` backend lane.
- Guard rejects new persistent authority and Make webhook dependencies.
- Capability simplification remains no-auto-delete.
- Technology discovery remains no-auto-adopt.
