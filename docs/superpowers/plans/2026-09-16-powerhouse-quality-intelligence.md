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
- Quality runtime and tests live under existing `scripts/brain/**`, `tests/brain-*` and `config/**` namespaces so existing BRAIN delivery classification remains authoritative.

---

### Task 1: Canonical quality contract and deterministic validator
**Files:** create `powerhouse/assurance/quality-intelligence.json`, `scripts/brain/powerhouse-quality-intelligence.mjs`; test `tests/brain-quality-intelligence.test.mjs`.
**Interfaces:** `validateQualityContract(contract)`, `classifyQualityImpact(paths, contract)`, `buildQualityState(input)`.
- [x] Write tests requiring all frontend/backend dimensions, deterministic release authority, learning integration and impact selection.
- [x] Prove RED because implementation is absent.
- [x] Implement validation, impact mapping and explainable per-dimension state.
- [x] Run contract tests and validator to GREEN.

### Task 2: Frontend deep audit
**Files:** create `scripts/brain/quality/frontend-deep-audit.mjs`, `powerhouse/assurance/quality-innovation-sources.json`; modify/create Quality Intelligence workflow.
- [x] Add cross-browser Chromium/Firefox/WebKit navigation over configured routes/viewports.
- [x] Collect console/page errors, failed/4xx/5xx critical requests, overflow, focus sanity and axe serious/critical violations.
- [x] Reuse existing geometry/CLS visual engine rather than duplicate it.
- [x] Upload evidence artifacts on deep runs.

### Task 3: Backend quality adapters
**Files:** create `tests/brain-quality/test_powerhouse_quality_properties.py`, `tests/brain-quality/test_powerhouse_api_contract.py`, `tests/brain-quality/test_powerhouse_integration_profile.py`, `tests/brain-quality-performance/powerhouse-smoke.js`.
- [x] Add Hypothesis invariants for quality-contract/path normalization.
- [x] Add Schemathesis adapter for a registered OpenAPI target.
- [x] Add Testcontainers adapter for a registered integration profile.
- [x] Add k6 p95/error-rate thresholds for public synthetic targets.
- [x] Treat missing registered targets as `NOT_REGISTERED`, never fake-green evidence.

### Task 4: Security, mutation and flake intelligence
**Files:** Quality Intelligence workflow, `.github/workflows/powerhouse-codeql.yml`, `config/stryker.quality.conf.json`, `scripts/brain/quality/repeat-flake-check.mjs`.
- [x] Run Trivy filesystem vulnerability/secret/misconfiguration scan.
- [x] Run passive ZAP baseline only on scheduled/manual public target.
- [x] Add CodeQL workflow without weakening existing permissions or controls.
- [x] Mutation-test deterministic quality logic.
- [x] Repeat core quality tests and fail on inconsistent outcomes rather than retry-to-green.

### Task 5: Daily innovation scout
**Files:** `scripts/brain/quality/innovation-scout.mjs`, quality source registry and scheduled workflow job.
- [x] Poll only approved primary-source URLs and record status/etag/last-modified/content fingerprint as an artifact.
- [x] Never auto-adopt a version; mark change as `candidate_for_experiment`.
- [x] Document adoption gates: applicability, security/cost, benchmark, false positives, detection delta, speed delta and explicit adoption.

### Task 6: Assurance and release integration
**Files:** modify `powerhouse/assurance/component-registry.json`, `.github/workflows/powerhouse-assurance.yml`, `.github/workflows/lane-backend.yml`; create `docs/powerhouse/POWERHOUSE_QUALITY_INTELLIGENCE.md`.
- [x] Register Quality Intelligence as an active Assurance component.
- [x] Make core contract validation part of existing Assurance/backend release lanes.
- [x] Keep deep browser/security/performance suites parallel and scheduled/impact-selected.
- [x] Document evidence, operation, learning/writeback and hard boundaries.

### Task 7: Verification and protected delivery
- [x] Run chat-learning preflight on PR.
- [ ] Verify contract/unit/deep applicable jobs on exact final head SHA.
- [ ] Verify Required test is green on the final head SHA.
- [ ] Review final diff and CI evidence.
- [ ] Protected merge only after exact-head evidence is green.
- [ ] Read back current main and relevant production/scheduled configuration; do not call runtime capabilities proven where a registered external target is absent.
