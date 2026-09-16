# Powerhouse Quality Intelligence v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved canonical quality-intelligence layer over the existing Powerhouse Assurance and delivery system.

**Architecture:** Reuse existing visual/baseline/delivery/learning authorities. Add a deterministic quality contract and impact mapper, deep frontend runtime/a11y/cross-browser audit, backend property/contract/integration/performance adapters, flake/mutation/security/dependency checks, and a daily primary-source innovation scout. AI may assist diagnosis and test generation but cannot waive deterministic gates.

**Tech Stack:** Node 22, native node:test, Playwright, axe-core, Python/Hypothesis/Schemathesis/Testcontainers adapters, k6, CodeQL, Trivy, OWASP ZAP, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-16-powerhouse-quality-intelligence-design.md`

## Global Constraints
- Fingerprint: `powerhouse-quality-intelligence-v1`.
- Reuse existing Powerhouse Assurance, UI visual regression, BRAIN-DELIVERY-v2 and BRAIN-CLOSED-LOOP.
- Deterministic evidence only may approve release.
- No second persistent QA/learning truth.
- Expensive deep suites are impact/schedule selected.
- Existing security/baseline/production gates may only be strengthened.

---

### Task 1: Canonical quality contract and deterministic validator
**Files:** create `powerhouse/assurance/quality-intelligence.json`, `scripts/powerhouse-quality-intelligence.mjs`; test `tests/powerhouse-quality-intelligence.test.mjs`.
**Interfaces:** `validateQualityContract(contract)`, `classifyQualityImpact(paths, contract)`, `buildQualityState(input)`.
- [ ] Write tests requiring all frontend/backend dimensions, deterministic release authority, learning integration and impact selection.
- [ ] Prove RED because implementation is absent.
- [ ] Implement validation, impact mapping and explainable per-dimension state.
- [ ] Run contract tests and validator to GREEN.

### Task 2: Frontend deep audit
**Files:** create `scripts/quality/frontend-deep-audit.mjs`, `powerhouse/assurance/quality-innovation-sources.json`; modify/create Quality Intelligence workflow.
**Interfaces:** CLI consumes `QUALITY_BASE_URL`, route registry and browser set; emits JSON evidence and failure screenshots.
- [ ] Add cross-browser Chromium/Firefox/WebKit navigation over configured routes/viewports.
- [ ] Collect console/page errors, failed/4xx/5xx critical requests, overflow, focus sanity and axe serious/critical violations.
- [ ] Reuse existing geometry/CLS visual engine rather than duplicate it.
- [ ] Upload evidence artifacts on deep runs.

### Task 3: Backend quality adapters
**Files:** create `tests/backend/test_powerhouse_quality_properties.py`, `tests/backend/test_powerhouse_api_contract.py`, `tests/performance/powerhouse-smoke.js`, `scripts/quality/backend-targets.mjs`.
**Interfaces:** registered API/integration targets only; missing targets are explicit `not_registered` evidence, never fake green execution proof.
- [ ] Add Hypothesis invariants for quality-contract/path normalization and registered backend contracts.
- [ ] Add Schemathesis adapter for a registered OpenAPI file/URL.
- [ ] Add Testcontainers readiness adapter for registered integration profiles.
- [ ] Add k6 p95/error-rate thresholds for registered/public synthetic targets.

### Task 4: Security, mutation and flake intelligence
**Files:** create/update Quality Intelligence workflow plus `stryker.quality.conf.json`, `scripts/quality/repeat-flake-check.mjs`.
- [ ] Run Trivy filesystem vulnerability/secret/misconfiguration scan.
- [ ] Run passive ZAP baseline only on scheduled/manual public target.
- [ ] Add CodeQL workflow without weakening existing permissions or controls.
- [ ] Mutation-test deterministic quality logic.
- [ ] Repeat core quality tests and fail on inconsistent outcomes rather than retry-to-green.

### Task 5: Daily innovation scout
**Files:** create `scripts/quality/innovation-scout.mjs`, quality source registry and scheduled workflow job.
- [ ] Poll only approved primary-source URLs and record status/etag/last-modified/content fingerprint as an artifact.
- [ ] Never auto-adopt a version; mark change as `candidate_for_experiment`.
- [ ] Document adoption gates: applicability, security/cost, benchmark, false positives, detection delta, speed delta, rollback.

### Task 6: Assurance and release integration
**Files:** modify `powerhouse/assurance/component-registry.json`, `.github/workflows/powerhouse-assurance.yml`, `.github/workflows/lane-backend.yml`; create `docs/powerhouse/POWERHOUSE_QUALITY_INTELLIGENCE.md`.
- [ ] Register Quality Intelligence as an active Assurance component.
- [ ] Make core contract validation part of existing Assurance/backend release lanes.
- [ ] Keep deep browser/security/performance suites parallel and scheduled/impact-selected.
- [ ] Document evidence, operation, learning/writeback and hard boundaries.

### Task 7: Verification and protected delivery
- [ ] Run chat-learning preflight on PR.
- [ ] Verify contract/unit/deep applicable jobs on exact head SHA.
- [ ] Verify Required test is green.
- [ ] Review diff and CI evidence.
- [ ] Protected merge only after exact-head evidence is green.
- [ ] Read back current main and relevant production/scheduled configuration; do not call runtime capabilities proven where a registered external target is absent.