# Autonomous Improvement Runtime v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing Continuous Improvement Engine into a periodic, deterministic, evidence-driven runtime that implements scheduler/orchestration, architecture fitness, capability graph projection, champion/challenger experiments, causal learning, replay, chaos testing, simplification and business-value feedback without new persistent authorities.

**Architecture:** Extend the existing `scripts/brain/continuous-improvement/` module with focused pure-function units plus one runtime composer. Reuse `Business OS Intelligence` as the scheduled GitHub execution surface, keep persistence routed through existing Brain/Supabase writers, and extend the Engineering OS contract/tests so the feature is fail-closed and release-gated.

**Tech Stack:** Node.js ESM, node:test/assert, GitHub Actions, existing Powerhouse Engineering OS/Quality Intelligence/Brain/Supabase authorities.

**Spec:** `docs/superpowers/specs/2026-09-16-autonomous-improvement-runtime-v1-design.md`

## Global Constraints
- No new brain, queue, scheduler authority, analytics truth, learning store, capability registry, experiment database or architecture registry.
- Unknown critical evidence fails closed.
- Security/correctness/tenant isolation are non-degradation gates.
- No single magic score decides release.
- Causality is not assumed.
- Destructive simplification remains protected by existing hard-boundary and delivery controls.
- Business value must come from observed outcome evidence; unknown remains unknown.
- Exact candidate/run identity, idempotency and rollback/fallback are mandatory for side effects.

---

### Task 1: RED runtime contract tests
**Files:** Modify `tests/brain-powerhouse-engineering-os-contract.test.mjs`.
**Produces:** executable assertions for the new runtime fingerprint and all nine capabilities.
- [ ] Add imports for the runtime helpers.
- [ ] Add failing tests for deterministic run identity, >30% fitness regression, overlap/gap projection, champion/challenger minimum observations and guardrails, causal default false, replay deltas, safe chaos classification, non-destructive simplification, and business-value priority.
- [ ] Run `node --test tests/brain-powerhouse-engineering-os-contract.test.mjs` and confirm RED before implementation.

### Task 2: Implement pure runtime helpers
**Files:** Create `scripts/brain/continuous-improvement/autonomous-runtime.mjs`.
**Produces:** `buildRunId`, `measureArchitectureFitness`, `buildCapabilityGraph`, `decideExperimentPortfolio`, `assessCausalEvidence`, `replayPolicy`, `runFailureInjection`, `findSimplificationCandidates`, `prioritizeByBusinessValue`, `buildAutonomousImprovementPacket`.
- [ ] Implement stable canonical JSON/run hashing.
- [ ] Implement dimension-level baseline/current/delta/percent/trend with `unknown` preservation and material regression flagging.
- [ ] Build a projection graph from supplied capabilities/agents/components/tools/tests; identify overlaps and missing requirements without persistence.
- [ ] Decide champion/challenger only when declared primary metric, minimum observations and guardrails are satisfied.
- [ ] Return causal confidence metadata but only `causalClaim=true` when explicit identification requirements are met.
- [ ] Replay historical events through supplied baseline/candidate decision functions and return decision deltas, not invented outcome deltas.
- [ ] Execute isolated synthetic failure cases and classify expected recovery/hold behavior.
- [ ] Detect duplicate/dead/unused candidates; return proposal objects only.
- [ ] Rank improvement candidates by observed business value, freshness and confidence while preserving `unknown`.
- [ ] Compose one deterministic runtime packet.
- [ ] Run the focused test file until GREEN.

### Task 3: Register runtime in Engineering OS
**Files:** Modify `config/powerhouse-engineering-os.json`, `scripts/brain/powerhouse-engineering-os.mjs`, and the Engineering OS contract test.
- [ ] Add `autonomous_improvement_runtime` with fingerprint, lifecycle, capability flags and scheduler integration rule.
- [ ] Extend fail-closed validator and CLI/check packet output.
- [ ] Prove drift fails validation.

### Task 4: Reuse Business OS Intelligence scheduler
**Files:** Modify `.github/workflows/business-os-intelligence.yml`.
- [ ] Add a bounded daily schedule and a runtime contract step; do not introduce a new workflow family.
- [ ] Keep permissions read-only for pure evaluation.
- [ ] Ensure writeback is not attempted without existing canonical writer credentials/route.
- [ ] Add the workflow to relevant path triggers.

### Task 5: Required CI coverage and documentation
**Files:** Modify `.github/workflows/required-test.yml`, `docs/development-operating-system.md` only if needed by existing contract wording.
- [ ] Ensure Required CI executes the autonomous runtime tests through the canonical Engineering OS test lane.
- [ ] Verify documentation states the runtime is evidence/projector logic above existing authorities, not a new truth store.
- [ ] Run all targeted tests plus `node scripts/brain/powerhouse-engineering-os.mjs --check`.

### Task 6: Protected delivery/readback
- [ ] Open PR from `feat/autonomous-improvement-runtime-v1` to `main`.
- [ ] Wait for exact-head Required and BRAIN/delivery checks.
- [ ] Merge with expected-head protection only when terminal green.
- [ ] Verify new main contains the merge SHA and the runtime files/contract.
- [ ] Record final status as LIVE & BEWEZEN only if protected merge and exact-main readback are both proven; otherwise return a concrete recovery packet.
