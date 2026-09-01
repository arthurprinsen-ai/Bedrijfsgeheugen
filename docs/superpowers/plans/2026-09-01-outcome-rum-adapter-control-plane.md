# Outcome, RUM & Adapter Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build generic 30/90/180 realised-value evaluation, close authenticated RUM ingest through SLO evidence, and enforce estate-wide adapter conformance on the existing canonical Brain.

**Architecture:** Extend the existing Whole Brain with three pure fail-closed control-plane modules and versioned contracts. Runtime side effects stay in existing thin API/worker boundaries; code/CI never substitutes for production evidence.

**Tech Stack:** Node.js ES modules, node:test, JSON contracts, Netlify Functions, Supabase/Postgres production stores, GitHub Actions, Make/BG166-BG169 evidence plane.

**Spec:** `docs/superpowers/specs/2026-09-01-outcome-rum-adapter-control-plane-design.md`

## Global Constraints

- No second Brain or parallel source of truth.
- No synthetic RUM samples.
- No 30/90/180 realised-value proof before the due instant.
- Registry presence is never adapter production-readiness proof.
- Unknown, stale, capacity-unknown or execution-unverified states fail closed.
- Existing BG166/BG167/BG168/BG169 authorities remain canonical.
- Exact current-main overlap must be rechecked immediately before delivery.

---

### Task 1: Generic outcome horizon engine

**Files:**
- Create: `brain/operating-loop/outcome-horizons.mjs`
- Create: `brain/contracts/outcome-horizon-loop-v1.json`
- Create: `tests/brain-outcome-horizon-loop.test.mjs`

**Interfaces:**
- Produces: `scheduleOutcomeHorizons(outcome,{now}) -> evaluation[]`
- Produces: `evaluateOutcomeHorizon(evaluation,{now,evidence,result,realisedValue,valueUnit}) -> evaluationResult`

- [ ] Write RED tests proving exactly 30/90/180 horizons, deterministic ids, no early verification, evidence-required due evaluation, and bounded `WAITING_FOR_EVIDENCE`.
- [ ] Run `node --test tests/brain-outcome-horizon-loop.test.mjs`; expect RED because module/contract are absent.
- [ ] Implement pure scheduling/evaluation code and versioned contract.
- [ ] Re-run the test; expect PASS.
- [ ] Commit as `feat: add generic outcome horizon engine`.

### Task 2: Runtime RUM window/SLO processor

**Files:**
- Create: `brain/operating-loop/runtime-slo-window.mjs`
- Create: `brain/contracts/runtime-rum-ingest-v2.json`
- Create: `tests/brain-runtime-slo-window.test.mjs`

**Interfaces:**
- Consumes: `assessRuntimeSlo` from `brain/operating-loop/runtime-telemetry.mjs`.
- Produces: `aggregateRuntimeWindow(metrics,{minSamples})`.
- Produces: `projectRuntimeSlo(metrics,options)` returning p95 metrics, sample count, status and breach obligation when required.

- [ ] Write RED tests proving real-metric-only aggregation, per revision/surface/route window isolation, deterministic p95, `NOT_PROVEN` below minimum samples, PASS and breach obligation behavior.
- [ ] Run the isolated test and confirm RED.
- [ ] Implement deterministic percentile/window processor and ingest-to-evidence contract.
- [ ] Re-run isolated test and confirm PASS.
- [ ] Commit as `feat: close runtime rum slo processing`.

### Task 3: Estate-wide adapter conformance engine

**Files:**
- Create: `brain/operating-loop/adapter-conformance.mjs`
- Create: `brain/contracts/adapter-conformance-v1.json`
- Create: `tests/brain-adapter-conformance.test.mjs`
- Modify: `config/brain-platform-adapters.json`

**Interfaces:**
- Produces: `evaluateAdapterConformance(registry,evidenceByPlatform) -> {platforms,summary}`.
- Each platform result exposes `status`, `productionReady`, `missing`, `blocked`, and evidence identity.

- [ ] Write RED tests loading the actual adapter registry and requiring every registered adapter to receive a conformance result.
- [ ] Require missing telemetry/capacity/execution/revision/rollback/lineage to prevent READY.
- [ ] Require future/unknown adapter behavior to fail closed.
- [ ] Implement evaluator and explicit conformance contract reference in platform registry.
- [ ] Run tests and confirm PASS.
- [ ] Commit as `feat: enforce estate wide adapter conformance`.

### Task 4: Cross-capability completion contracts

**Files:**
- Create: `tests/brain-outcome-rum-adapter-integration.test.mjs`
- Modify: `brain/contracts/production-evidence-v1.json`

**Interfaces:**
- Consumes all three new modules/contracts.
- Produces one machine-readable assertion that BUILT and PROVEN remain distinct for time-bound outcomes, traffic-bound RUM and evidence-bound adapters.

- [ ] Write RED integration assertions against current production evidence contract.
- [ ] Extend production evidence classes with `outcomeHorizons`, `rumIngestSlo`, and `adapterConformance` without weakening existing evidence rules.
- [ ] Run targeted tests and whole relevant `node --test tests/brain-*.test.mjs` set.
- [ ] Commit as `feat: unify outcome rum adapter evidence gates`.

### Task 5: Governed delivery and runtime proof

- [ ] Compare branch base with current `main`; fail on overlapping semantic drift.
- [ ] Open governed PR from exact branch head.
- [ ] Read exact-head CI/checks; fix root cause rather than blind reruns.
- [ ] Merge only when normal repository governance permits.
- [ ] Verify exact production commit identity and deployed contracts/code.
- [ ] Verify RUM raw rows/SLO only from genuine authenticated traffic; if sample threshold is not met, retain `WAITING_FOR_REAL_TRAFFIC`/`NOT_PROVEN`.
- [ ] Verify 30/90/180 obligations exist and remain pending until due dates; never fabricate realised values.
- [ ] Evaluate current registered adapters using current production evidence; READY only where every required proof exists.
- [ ] Persist material delivery learning through BG168 -> BG166 and verify downstream persistence/readback; refresh shared state through BG167/coalesced path.
