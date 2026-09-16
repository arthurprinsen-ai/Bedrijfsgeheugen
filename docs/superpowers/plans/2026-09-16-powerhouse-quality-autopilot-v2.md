# Powerhouse Quality Autopilot v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mature `powerhouse-quality-intelligence-v2` into a closed-loop Quality Autopilot that discovers untested surfaces, accumulates deep-sensor history, learns test effectiveness from escaped defects, verifies business invariants, blocks new security regressions, attributes performance regressions, exercises safe fault scenarios, and benchmarks new testing technology without creating a parallel quality or learning authority.

**Architecture:** Extend the approved Quality Intelligence v2 contract and existing `scripts/brain/quality/**` modules. Persist only machine-readable evidence artifacts/configuration in the existing repo/Assurance path and hand material outcomes to `BRAIN-CLOSED-LOOP-v1`; v1 remains deterministic release authority. Expensive/deep sensors stay scheduled/manual/impact-driven and never become green merely because they are installed.

**Tech Stack:** Node.js 22, GitHub Actions, Playwright, Stryker, OWASP ZAP, Trivy, k6, existing Powerhouse Assurance/BRAIN delivery contracts, JSON evidence registries.

**Spec:** `docs/superpowers/specs/2026-09-16-powerhouse-quality-intelligence-v2-design.md`

## Global Constraints

- Preserve `powerhouse-quality-intelligence-v1` as deterministic release authority.
- Extend, do not fork, `powerhouse-quality-intelligence-v2`.
- Reuse `BRAIN-DELIVERY-v2`, Powerhouse Assurance, BG169 and `BRAIN-CLOSED-LOOP-v1`.
- `UNKNOWN` and `NOT_REGISTERED` are never green.
- No production-destructive chaos/fault injection.
- Critical security, tenant isolation, data integrity and business invariants are never automatically demoted or removed.
- New technology is promoted only after isolated benchmark evidence beats the incumbent on relevant defect-yield/runtime/cost criteria.

---

### Task 1: Autopilot maturity contract

**Files:**
- Create: `config/powerhouse-quality-autopilot.json`
- Create: `tests/brain-quality-autopilot.test.mjs`
- Modify: `powerhouse/assurance/quality-intelligence-v2.json`
- Modify: `scripts/brain/powerhouse-quality-intelligence.mjs`

**Interfaces:**
- Produces `validateQualityAutopilotContract(contract)` with mandatory capability, evidence, safety and learning rules.

- [ ] Write failing tests requiring deep-sensor history, dynamic surface discovery, vulnerability delta blocking, test effectiveness learning, business invariants, performance attribution, safe game days and innovation benchmarking.
- [ ] Run `node --test tests/brain-quality-autopilot.test.mjs`; expect failure because the contract/validator is absent.
- [ ] Implement the minimal validator and config; v2 release authority remains unchanged.
- [ ] Re-run the targeted test plus `tests/brain-quality-intelligence*.test.mjs`; expect pass.
- [ ] Commit.

### Task 2: Dynamic Coverage Intelligence

**Files:**
- Create: `scripts/brain/quality/surface-discovery.mjs`
- Create: `config/powerhouse-quality-surface-patterns.json`
- Modify: `scripts/brain/quality/coverage-intelligence.mjs`
- Test: `tests/brain-quality-autopilot.test.mjs`

**Interfaces:**
- Produces `discoverQualitySurfaces({files, registeredSurfaces})` and `buildDiscoveryObligations(...)`.
- Surface types: route, API/OpenAPI path, Supabase RPC/function, table/schema, permission/RLS policy declaration, critical journey.

- [ ] Add failing tests proving a newly discovered surface without evidence becomes `UNTESTED`/`NOT_REGISTERED` and never green.
- [ ] Run targeted tests and capture RED.
- [ ] Implement deterministic path/content-pattern discovery with dedupe and provenance.
- [ ] Re-run tests; expect GREEN.
- [ ] Commit.

### Task 3: Deep sensor execution history and test effectiveness

**Files:**
- Create: `scripts/brain/quality/evidence-history.mjs`
- Create: `config/powerhouse-quality-sensors.json`
- Modify: `scripts/brain/quality/test-economics.mjs`
- Modify: `.github/workflows/powerhouse-quality-intelligence.yml`
- Test: `tests/brain-quality-autopilot.test.mjs`

**Interfaces:**
- Produces `recordSensorEvidence(...)`, `summarizeSensorHistory(...)`, and `classifyTestEffectiveness(...)`.
- Tracks run count, pass/fail, detected defect lineage, flaky outcomes, runtime/cost evidence and escaped-defect misses.

- [ ] Add failing tests for installed-but-never-run sensors, flaky tests, zero-yield tests, critical-test protection and escaped-defect miss attribution.
- [ ] Run targeted tests; expect RED.
- [ ] Implement deterministic history normalization and effectiveness classification without automatic deletion.
- [ ] Wire scheduled/manual lanes so cross-browser exploration, semantic visual, mutation, fuzz/chaos, ZAP, Trivy and k6 emit evidence artifacts/history when their prerequisites exist; missing prerequisites remain explicit obligations.
- [ ] Run targeted tests/workflow contract checks; expect GREEN or explicit fail-closed obligation states.
- [ ] Commit.

### Task 4: Fail-closed vulnerability delta gate

**Files:**
- Create: `scripts/brain/quality/vulnerability-delta.mjs`
- Create: `config/powerhouse-vulnerability-baseline.json`
- Modify: `.github/workflows/powerhouse-quality-intelligence.yml`
- Test: `tests/brain-quality-autopilot.test.mjs`

**Interfaces:**
- Produces `evaluateVulnerabilityDelta({baseline,current}) -> {status,newBlocking,resolved,unchanged}`.

- [ ] Add failing tests proving a new severity-at-or-above threshold finding blocks while unchanged accepted baseline findings remain evidence-visible.
- [ ] Run targeted tests; expect RED.
- [ ] Implement exact-id/package/path normalized delta comparison with an explicit reviewed baseline contract.
- [ ] Wire Trivy/ZAP evidence through the delta evaluator; no scanner failure may be coerced to green.
- [ ] Run targeted tests; expect GREEN.
- [ ] Commit.

### Task 5: Production Shadow business invariants and escaped-defect prevention

**Files:**
- Create: `config/powerhouse-quality-business-invariants.json`
- Modify: `scripts/brain/quality/production-shadow.mjs`
- Create: `scripts/brain/quality/escaped-defect-prevention.mjs`
- Test: `tests/brain-quality-production-shadow.test.mjs`
- Test: `tests/brain-quality-autopilot.test.mjs`

**Interfaces:**
- Business invariant chain: `action -> provider -> readback -> outcome -> learning`.
- Cross-cutting invariants: tenant integrity, idempotency, exact destination/identity, no partial-success green state.
- Produces `computeEscapedDefectPreventionRate({escapedDefects, regressionEvidence})`.

- [ ] Add failing tests for broken chain, tenant mismatch, duplicate event, partial write and missing learning writeback.
- [ ] Add failing tests for prevention-rate numerator/denominator and missing regression evidence.
- [ ] Implement invariant evaluation and prevention metric; escaped defects create regression obligations, never a parallel datastore.
- [ ] Run tests; expect GREEN.
- [ ] Commit.

### Task 6: Performance attribution and safe Game Days

**Files:**
- Create: `scripts/brain/quality/performance-attribution.mjs`
- Create: `scripts/brain/quality/game-day.mjs`
- Create: `config/powerhouse-quality-game-days.json`
- Modify: `.github/workflows/powerhouse-quality-intelligence.yml`
- Test: `tests/brain-quality-autopilot.test.mjs`

**Interfaces:**
- Produces `attributePerformanceRegression({candidateSha, route, api, functionName, queryFingerprint, dependency, baseline, current})`.
- Produces `planSafeFaultScenario(scenario)` rejecting destructive production targets.

- [ ] Add failing tests for exact commit/route/API/function/query/dependency attribution fields and unknown attribution remaining `UNKNOWN`.
- [ ] Add failing tests for provider outage, timeout, stale data, duplicate event, expired token and partial-write scenarios; production-destructive target must be rejected.
- [ ] Implement minimal attribution and safe scenario planner.
- [ ] Wire manual/scheduled non-production Game Day matrix; no paid resource escalation or secret mutation.
- [ ] Run tests; expect GREEN.
- [ ] Commit.

### Task 7: Innovation benchmark promotion gate

**Files:**
- Create: `scripts/brain/quality/innovation-benchmark.mjs`
- Modify: `scripts/brain/quality/innovation-scout.mjs`
- Modify: `config/powerhouse-quality-autopilot.json`
- Test: `tests/brain-quality-autopilot.test.mjs`

**Interfaces:**
- Produces `evaluateInnovationBenchmark({incumbent,candidate,weights,minimumEvidence})` with `ADOPT`, `REJECT` or `INSUFFICIENT_EVIDENCE`.
- Required measures: defect yield, false positive rate, runtime, cost, reproducibility/security fit.

- [ ] Add failing tests proving a fashionable/new tool is rejected without benchmark evidence and a candidate can only be promoted when it meets explicit improvement thresholds without security regression.
- [ ] Run tests; expect RED.
- [ ] Implement deterministic comparison and evidence requirements.
- [ ] Re-run tests; expect GREEN.
- [ ] Commit.

### Task 8: Canonical assurance, docs, merge and readback

**Files:**
- Modify: `.github/workflows/powerhouse-assurance.yml`
- Modify: `.github/workflows/lane-backend.yml`
- Modify: `docs/powerhouse/POWERHOUSE_QUALITY_INTELLIGENCE.md`
- Modify: `powerhouse/assurance/components.json` if registry evidence requires it.

**Interfaces:**
- Consumes all Autopilot deterministic contracts.
- Produces one canonical Quality Intelligence v2 maturity path and explicit open obligations for unavailable runtime prerequisites.

- [ ] Add Autopilot tests/validators to existing backend/Assurance lanes while deep sensors stay scheduled/manual/impact-driven.
- [ ] Run all available exact-head Required/BRAIN/Quality/Assurance/security gates in GitHub Actions.
- [ ] Diagnose any red gate with root cause + regression; do not blind-retry.
- [ ] Update human-readable documentation and learning/writeback obligations.
- [ ] Protected merge only after exact-head required evidence is green.
- [ ] Perform current-main readback and verify merge SHA/quality contract.
- [ ] Mark `LIVE & BEWEZEN` only for evidence actually proven; enumerate any remaining environmental/secret/provider obligations precisely.
