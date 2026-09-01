# Make Data Transfer Governor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Powerhouse cost-control chain so Make credits and data transfer are governed together, high-transfer scenarios are attributed and optimized before account-wide exhaustion, and every material breach/fix becomes reusable Brain intelligence.

**Architecture:** Keep BG82 as the O(1) team-usage sensor, BG159 as scenario-level baseline owner, BG162 as governed execution router, and PH Agent 14 as the optimization specialist. Add deterministic policy/readiness contracts in the repository, then patch the existing Make scenarios to classify GREEN/AMBER/RED/HARD, detect per-scenario anomalies, degrade non-critical work first, and route proven outcomes through BG211 → BG205 → BG168/BG166 → BG167.

**Tech Stack:** GitHub Actions/Node.js contract tests; Make scenarios BG82/BG159/BG162/PH14; Notion cost/learning stores; BG211 universal event ingest; BG205 Business Graph; BG168/BG166/BG167 Brain learning chain.

**Spec:** `docs/superpowers/specs/2026-09-01-make-data-transfer-governor-design.md`

## Global Constraints

- No parallel cost controller or second source of truth.
- BG82 remains O(1): one team-usage read per cycle; no estate-wide fanout from BG82.
- GREEN <60%, AMBER 60–80%, RED 80–95%, HARD >=95% or projected month exhaustion.
- The thresholds are Powerhouse operating thresholds, not Make product limits.
- No paid AI for deterministic threshold classification.
- No blind retries while Make reports team/org paused, quota exceeded or capacity exhaustion.
- Never buy or increase Make capacity autonomously.
- Preserve CRITICAL_PUBLISHING, CRITICAL_REVENUE_OUTCOME, CRITICAL_RECOVERY_SECURITY and CRITICAL_BRAIN before STANDARD_OPERATIONAL and DISCRETIONARY_ENRICHMENT.
- Disabling is containment only and creates a recovery obligation.
- Proven learning requires root cause, failed approach, proven fix, prevention rule, regression contract and evidence before durable projection.

---

### Task 1: Deterministic budget and zone policy

**Files:**
- Create: `tools/make-cost-governor-policy.mjs`
- Create: `tests/make-cost-governor-policy.test.mjs`
- Modify: `.github/workflows/required-test.yml` to execute the new test.

**Interfaces:**
- Produces `classifyMakeBudget({usedBytes, monthlyCapBytes, dayOfMonth, daysInMonth, usedCredits, monthlyCreditCap})`.
- Returns `{zone, byteRatio, creditRatio, projectedMonthExhaustion, safeDailyAllowanceBytes, actionPolicy}`.

- [ ] **Step 1: Write failing tests** for GREEN, AMBER, RED, HARD, projected exhaustion and missing-cap fail-closed behavior.
- [ ] **Step 2: Run the required test workflow and verify RED** because the policy module does not exist.
- [ ] **Step 3: Implement the minimal pure policy** with exact thresholds and no external calls.
- [ ] **Step 4: Re-run and require GREEN**.
- [ ] **Step 5: Commit** `feat: add deterministic Make transfer budget policy`.

### Task 2: Scenario anomaly and criticality policy

**Files:**
- Modify: `tools/make-cost-governor-policy.mjs`
- Modify: `tests/make-cost-governor-policy.test.mjs`

**Interfaces:**
- Produces `classifyScenarioAnomaly({bytesPerRun, baselineBytesPerRun, bytesPerOperation, baselineBytesPerOperation, dailyBytesDelta, safeDailyAllowanceBytes, zeroValueRuns, criticality})`.
- Produces a degradation policy that never suppresses the four CRITICAL_* classes solely due to RED/HARD budget pressure.

- [ ] **Step 1: Add failing 2x-baseline and criticality tests**.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Implement anomaly and degradation logic**.
- [ ] **Step 4: Verify GREEN**.
- [ ] **Step 5: Commit** `feat: add scenario transfer anomaly policy`.

### Task 3: New-producer readiness contract

**Files:**
- Create: `config/make-cost-governance-contract.json`
- Create: `tests/make-cost-governance-contract.test.mjs`
- Modify: `.github/workflows/required-test.yml`

**Interfaces:**
- Mandatory metadata: `credit_budget`, `data_transfer_budget`, `max_payload_policy`, `page_batch_window_limit`, `dedupe_key`, `criticality_class`, `degradation_strategy`, `outcome_proof_signal`, `universal_event_ingest`.

- [ ] **Step 1: Add failing contract tests** proving unknown/new Make producer definitions fail closed when metadata is absent.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Add canonical schema/default ownership contract**; defaults may assign ownership but may not silently invent numeric entitlements.
- [ ] **Step 4: Verify GREEN**.
- [ ] **Step 5: Commit** `feat: enforce Make cost governance readiness`.

### Task 4: Patch BG82 team budget controller

**Runtime:** Make scenario `BG 82 - Powerhouse Cost + Runtime Guard v8.1 class-aware recovery` (`7032571`).

**Interfaces:**
- Consumes current `make:getUsage` output from module 2.
- Produces deterministic zone, safe daily allowance, breach fingerprint and requested degradation action before incident dispatch.

- [ ] **Step 1: Read BG82 fresh** and capture `lastEdit`, module 2 usage mapping, module 6 incident logging and module 30 dispatch mapping.
- [ ] **Step 2: Patch one deterministic code step immediately after module 2** to compute GREEN/AMBER/RED/HARD from current team usage and explicit configured cap fallback.
- [ ] **Step 3: Replace the fixed `>=75 MB` alarm filter** with zone-based materiality while keeping rate-limit emergency behavior.
- [ ] **Step 4: Update incident evidence** to include byte ratio, credit ratio, zone, daily allowance, cap source and projected exhaustion.
- [ ] **Step 5: Read BG82 back** and verify O(1) topology is preserved.

### Task 5: Patch BG159 scenario baselines and anomaly attribution

**Runtime:** Make scenario `BG 159 - Powerhouse Cost Snapshot Collector v1` (`7132648`).

**Interfaces:**
- Extends the existing daily delta calculator and single-candidate enrichment; does not add estate-wide rereads.
- Produces candidate metrics: bytes/run, bytes/operation, daily bytes delta, rolling baseline, ratio, criticality and anomaly fingerprint.

- [ ] **Step 1: Read fresh module 6/17 mappings and daily snapshot schema**.
- [ ] **Step 2: Patch the existing computation to derive transfer-efficiency metrics and 2x-baseline anomaly classification**.
- [ ] **Step 3: Ensure only one bounded candidate per daily snapshot is enriched**.
- [ ] **Step 4: Route an anomalous candidate to BG162 with stable scenario identity/fingerprint**.
- [ ] **Step 5: Read back and verify the expensive-snapshot dedupe remains intact**.

### Task 6: Patch BG162/PH14 degradation execution

**Runtime:** Make scenarios `BG 162 - Adaptive Cost & Quality Governor v1` (`7135438`) and `PH Agent 14 - Make Cost Optimizer v3 stable runner` (`7088656`).

**Interfaces:**
- BG162 consumes the zone/anomaly event and chooses the smallest reversible action.
- PH14 may recommend or execute only bounded safe actions allowed by BG162.

- [ ] **Step 1: Read fresh BG162 module 2/37/39 and PH14 decision prompt/tools**.
- [ ] **Step 2: Extend deterministic classification with `criticality`, `budget_zone`, `data_transfer_ratio`, `recommended_degradation`**.
- [ ] **Step 3: Enforce optimization order: fields → page/window → reference → dedupe → batch → cache → schedule → discretionary AI → temporary throttle**.
- [ ] **Step 4: Block any action that buys capacity, weakens security/privacy, or permanently disables a critical producer**.
- [ ] **Step 5: Read back both scenarios and verify existing recovery lanes remain intact**.

### Task 7: Brain event and learning integration

**Runtime:** BG211 → BG205 → BG168/BG166 → BG167.

**Interfaces:**
- Stable fingerprints for team budget breach and scenario transfer anomaly.
- Material events store before/after usage and only project proven fixes as durable learning.

- [ ] **Step 1: Ensure BG82/BG159 event payloads contain universal event ownership, exact scenario/execution evidence and retention/materiality fields**.
- [ ] **Step 2: Route material breach/anomaly events through BG211 rather than a bespoke learning path**.
- [ ] **Step 3: Verify known-capacity-paused state does not cause retries**.
- [ ] **Step 4: When Make becomes executable, perform exactly one bounded deterministic canary and verify BG211 acceptance, BG205 lineage, BG168 dispatch, BG166 `learning_persisted=true`, and BG167 projection**.
- [ ] **Step 5: If Make is still paused, leave one dedupeable recovery obligation and do not claim runtime closure**.

### Task 8: Production verification and delivery

**Files/Runtime:** GitHub branch + Make readback.

- [ ] **Step 1: Run all repository contract tests on the exact branch head**.
- [ ] **Step 2: Verify BG82/BG159/BG162/PH14 saved revisions and connections are intact**.
- [ ] **Step 3: Verify no new scenario was introduced and no critical scenario was disabled**.
- [ ] **Step 4: Open a PR from `feature/make-data-transfer-governor` to `main`; wait for exact-head required checks**.
- [ ] **Step 5: Recheck moving-main/mergeability; merge only under protected checks**.
- [ ] **Step 6: Verify production/main commit and preserve any Make runtime proof obligation until executable evidence exists**.

## Self-review

- Spec coverage: all budget zones, anomaly detection, criticality, new-producer contract, bounded self-heal, Brain closed loop and runtime proof are mapped to tasks.
- Placeholder scan: no TBD/TODO or undefined later work remains.
- Type consistency: policy fields and Make event fields use the same names across Tasks 1–7.
- Scope: one subsystem only — Make cost/data-transfer governance on the existing control chain.