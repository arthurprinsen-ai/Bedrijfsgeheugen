# Powerhouse Quality Intelligence v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend Quality Intelligence v1 with blind-spot discovery, bounded exploration/adversarial testing, production feedback, provenance and evidence-based test optimization.

**Architecture:** v2 extends the existing deterministic v1 contracts and BRAIN/Assurance delivery authorities. New sensors may discover and recommend, but only deterministic adopted evidence participates in release decisions; no parallel QA or learning store is introduced.

**Tech Stack:** Node.js, Playwright, existing Powerhouse Assurance/BRAIN scripts, GitHub Actions/CodeQL, Trivy, ZAP, Stryker, property/state testing adapters, GitHub artifact attestations/SBOM where eligible.

**Spec:** `docs/superpowers/specs/2026-09-16-powerhouse-quality-intelligence-v2-design.md`

## Global Constraints

- Preserve `powerhouse-quality-intelligence-v1` as deterministic release authority.
- Reuse `BRAIN-DELIVERY-v2`, Powerhouse Assurance, BG169 and BRAIN-CLOSED-LOOP.
- Keep implementation inside existing registered namespaces.
- `UNKNOWN`/`NOT_REGISTERED` can never become green evidence.
- Expensive exploration is impact/risk driven and scheduled/manual by default.
- AI may not waive gates or autonomously delete/weaken critical tests.

---

### Task 1: v2 contract and RED regression

**Files:**
- Create: `powerhouse/assurance/quality-intelligence-v2.json`
- Create: `tests/brain-quality-intelligence-v2.test.mjs`
- Modify: `powerhouse/assurance/components.json`

**Interfaces:**
- Consumes: v1 Assurance registry and Quality Intelligence fingerprint.
- Produces: machine-readable v2 capability contract and deterministic validator expectations.

- [ ] Write the failing Node contract test asserting all ten v2 capabilities, fail-closed evidence states and v1 inheritance.
- [ ] Run `node --test tests/brain-quality-intelligence-v2.test.mjs`; expect FAIL because the v2 contract/validator is absent.
- [ ] Add the minimal v2 JSON contract and registry entry.
- [ ] Re-run the test; contract-only assertions pass while executable assertions remain red.
- [ ] Commit the RED→contract foundation.

### Task 2: Coverage Intelligence and gap obligations

**Files:**
- Create: `scripts/brain/quality/coverage-intelligence.mjs`
- Create: `config/powerhouse-quality-surfaces.json`
- Modify: `scripts/brain/powerhouse-quality-intelligence.mjs`
- Test: `tests/brain-quality-intelligence-v2.test.mjs`

**Interfaces:**
- Produces: `buildCoverageReport({surfaces,evidence}) -> {covered,gaps,unknown}` with explicit evidence state and authority.

- [ ] Add failing tests for covered, missing and unregistered surfaces; assert missing/unregistered never return green.
- [ ] Run targeted Node tests and capture RED.
- [ ] Implement deterministic inventory/evidence comparison and obligation output.
- [ ] Run targeted tests and existing v1 contract tests; expect PASS.
- [ ] Commit.

### Task 3: Bounded exploration and semantic visual findings

**Files:**
- Create: `scripts/brain/quality/exploration-policy.mjs`
- Create: `tests/brain-quality-exploration.test.mjs`
- Modify: `.github/workflows/powerhouse-quality-intelligence.yml`

**Interfaces:**
- Produces: bounded exploration policy and normalized `candidate_finding` records; findings are advisory until deterministic reproduction exists.

- [ ] Write failing tests for destructive-action rejection, autonomy budgets and advisory-only AI findings.
- [ ] Run tests; expect RED.
- [ ] Implement policy/normalizer and wire scheduled/manual Playwright exploration without granting release authority.
- [ ] Run tests and workflow contract validation; expect PASS.
- [ ] Commit.

### Task 4: Stateful/fuzz/chaos and adversarial security matrix

**Files:**
- Create: `config/powerhouse-quality-adversarial-matrix.json`
- Create: `tests/brain-quality-adversarial.test.mjs`
- Modify: `.github/workflows/powerhouse-quality-intelligence.yml`

**Interfaces:**
- Produces: registered safe cases for retry/idempotency/order/malformed identity/tenant-boundary/rate-limit and provider-failure behavior.

- [ ] Write failing schema/contract tests requiring safe target classification and fail-closed missing targets.
- [ ] Run tests; expect RED.
- [ ] Add matrix and workflow adapters; production-destructive cases remain forbidden.
- [ ] Run targeted tests plus existing backend/security lanes; expect PASS or explicit NOT_REGISTERED for optional targets.
- [ ] Commit.

### Task 5: Production shadow and escaped-defect feedback

**Files:**
- Create: `scripts/brain/quality/production-shadow.mjs`
- Create: `tests/brain-quality-production-shadow.test.mjs`
- Modify: `powerhouse/assurance/quality-intelligence-v2.json`

**Interfaces:**
- Produces: normalized shadow observations and escaped-defect obligations compatible with existing BRAIN-CLOSED-LOOP writeback.

- [ ] Write failing tests for contract drift, SLO drift and escaped-defect obligation creation.
- [ ] Run tests; expect RED.
- [ ] Implement safe observation normalization and existing-learning handoff; no new datastore.
- [ ] Run tests; expect PASS.
- [ ] Commit.

### Task 6: Provenance/SBOM and test-effectiveness economics

**Files:**
- Create: `scripts/brain/quality/test-economics.mjs`
- Create: `tests/brain-quality-economics.test.mjs`
- Modify: `.github/workflows/powerhouse-quality-intelligence.yml`
- Modify: `powerhouse/assurance/quality-intelligence-v2.json`

**Interfaces:**
- Produces: lane recommendation from risk/cost/yield without gate-waiver semantics; eligible artifacts receive exact-SHA provenance/SBOM evidence.

- [ ] Write failing tests proving critical security/data tests cannot be demoted because of cost and unknown yield cannot be treated as zero risk.
- [ ] Run tests; expect RED.
- [ ] Implement deterministic lane recommendation and mutation/flake/defect-yield evidence aggregation.
- [ ] Add GitHub artifact attestation/SBOM step only for eligible produced artifacts; missing required support emits obligation.
- [ ] Run targeted tests/workflow validation; expect PASS.
- [ ] Commit.

### Task 7: Canonical Assurance, docs and release closure

**Files:**
- Modify: `.github/workflows/powerhouse-assurance.yml`
- Modify: `.github/workflows/lane-backend.yml`
- Modify: `docs/powerhouse-quality-intelligence.md`
- Modify: `powerhouse/assurance/components.json`

**Interfaces:**
- Consumes: all v2 deterministic contracts.
- Produces: one canonical Assurance/release path and human-readable operating documentation.

- [ ] Add v2 contract test to existing Assurance/backend fast lane while keeping deep sensors scheduled/manual/impact-driven.
- [ ] Run v1+v2 tests and validators; expect PASS.
- [ ] Update human-readable runbook with authority, evidence states, troubleshooting and learning loop.
- [ ] Open/update PR with exact scope and run Required, BRAIN delivery, Quality Intelligence, Assurance and CodeQL on exact head.
- [ ] If any gate is red, diagnose root cause and add regression before fixing; do not retry blindly.
- [ ] Protected merge only after exact-head required evidence is green and current-main drift is reconciled.
- [ ] Perform current-main/readback; update Powerhouse Handbook/System Map and existing learning/writeback authority with exact merge evidence.
- [ ] Mark `LIVE & BEWEZEN` only when all applicable evidence is proven; retain explicit obligations for unavailable registered runtime targets.
