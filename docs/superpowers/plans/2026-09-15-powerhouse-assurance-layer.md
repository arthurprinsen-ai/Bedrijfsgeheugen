# Powerhouse Assurance Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and production-prove a canonical assurance layer that inventories Powerhouse components, enforces documentation/coverage, detects repository drift, proves Portal V2 parity and recovery obligations, and feeds the existing closed-loop learning model.

**Architecture:** Extend the existing GitHub + Supabase/Powerhouse + Notion architecture. GitHub owns the machine-readable expected component/parity manifests and deterministic validators; existing runtime/provider readbacks remain evidence authority. The validator is wired into CI and produces stable evidence that can be projected into the existing Powerhouse documentation and state registers.

**Tech Stack:** Existing repository stack; JSON manifests; Node.js validation scripts/tests if Node is already the repository test runtime; GitHub Actions; existing Portal V2 tests; Notion Powerhouse documentation.

**Spec:** `docs/superpowers/specs/2026-09-15-powerhouse-assurance-layer-design.md`

## Global Constraints
- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- No parallel brain, database, queue, calendar, analytics store or learning store.
- Preserve current production authority boundaries.
- No secret values in documentation or manifests.
- `LIVE & BEWEZEN` fails closed on unmanaged assurance gaps.
- Every change is test-first and ends in repository/production readback and documentation writeback.

---

### Task 1: Map existing test and workflow conventions

**Files:**
- Read existing `package.json`/test scripts, `.github/workflows/*`, Portal V2 tests and Powerhouse docs.
- No production changes.

**Interfaces:**
- Consumes: current main repository conventions.
- Produces: exact commands and paths reused by later tasks.

- [ ] Inspect current test runner and scripts.
- [ ] Inspect required/release workflows and Portal V2 test workflow.
- [ ] Inspect current Powerhouse documentation/registry files.
- [ ] Confirm smallest compatible implementation surface.

### Task 2: Registry schema and failing validation tests

**Files:**
- Create: `powerhouse/assurance/component-registry.json`
- Create: `powerhouse/assurance/portal-v2-parity.json`
- Create: `scripts/powerhouse-assurance-check.mjs`
- Create/Test: repository-standard test file determined in Task 1.

**Interfaces:**
- Consumes: JSON manifests.
- Produces: `validateComponentRegistry(registry)`, `validatePortalParity(parity)`, deterministic CLI exit code.

- [ ] Write tests proving missing required dimensions fail.
- [ ] Write test proving duplicate `canonical_id` fails.
- [ ] Write lifecycle test proving deprecated/superseded components need retirement/migration evidence.
- [ ] Write parity test proving `missing`/`unknown` fails.
- [ ] Run tests and verify RED because validator/fixtures do not yet satisfy contracts.
- [ ] Implement minimum validator and starter manifests covering the assurance capability and existing canonical Powerhouse lanes.
- [ ] Run focused tests and verify GREEN.

### Task 3: Repository drift discovery

**Files:**
- Modify: `scripts/powerhouse-assurance-check.mjs`
- Modify: registry manifest.
- Test: same assurance test suite.

**Interfaces:**
- Produces: deterministic discovery for repository-owned production surfaces and `unregistered_surfaces` report.

- [ ] Add failing test with a discoverable surface absent from registry.
- [ ] Verify RED.
- [ ] Implement repo-surface discovery using explicit configured directories/patterns only; no provider guessing.
- [ ] Map known surfaces or explicit ignore rationale in registry.
- [ ] Verify GREEN.

### Task 4: Coverage report and full-live gate semantics

**Files:**
- Modify validator.
- Create: `docs/powerhouse/POWERHOUSE_ASSURANCE_LAYER.md` or nearest existing canonical docs location.
- Test: assurance suite.

**Interfaces:**
- Produces JSON report with `status`, `gaps`, `components`, `portal_parity`, `fingerprint`.

- [ ] Write failing tests for deterministic report and `LIVE & BEWEZEN` disallowance on gaps.
- [ ] Verify RED.
- [ ] Implement report generation and non-zero exit on unmanaged gaps.
- [ ] Verify GREEN.
- [ ] Document evidence-vs-contract distinction and no-fake-runtime-evidence rule.

### Task 5: Portal V2 parity manifest

**Files:**
- Populate `powerhouse/assurance/portal-v2-parity.json` from existing legacy/V2 routes and tests.
- Update Portal V2 documentation/tests only where existing parity is discoverably missing.

**Interfaces:**
- Produces one row per legacy capability: `verified|retired`, V2 surface, authority, writeback, tests, evidence.

- [ ] Inventory legacy portal capabilities from repository routes/navigation.
- [ ] Map each to V2 or explicit retirement.
- [ ] Add failing test for any unmapped capability.
- [ ] Close only gaps supported by current implementation; do not invent parity.
- [ ] Run parity tests.

### Task 6: Recovery and lifecycle assurance

**Files:**
- Extend registry fields for criticality, recovery proof and lifecycle evidence.
- Test: assurance suite.

**Interfaces:**
- Full-live eligibility requires tested recovery reference for critical components.

- [ ] Write failing critical-component recovery test.
- [ ] Verify RED.
- [ ] Implement recovery-proof validation.
- [ ] Record current tested/documented state honestly; unresolved tests become explicit gaps.
- [ ] Verify GREEN only when manifest and evidence contract are valid.

### Task 7: CI enforcement

**Files:**
- Create/modify `.github/workflows/powerhouse-assurance.yml` following repository conventions.
- Modify package/test script only if repository convention requires it.

**Interfaces:**
- GitHub check: deterministic assurance validation on PR and main.

- [ ] Add workflow invoking assurance tests and validator.
- [ ] Push branch and confirm check fails if an intentional negative fixture is active, then remove fixture.
- [ ] Confirm check succeeds on valid branch.

### Task 8: Legacy obligation reconciliation

**Files:**
- Existing Powerhouse docs/state records; no parallel ledger.

**Interfaces:**
- Every identified legacy obligation gets `open|resolved|superseded|retired`, owner/evidence/next-action if open.

- [ ] Re-read known BG168/BG166 and evidence-first calibration obligations against current architecture.
- [ ] Close/supersede only with evidence; otherwise retain one deduped open obligation.
- [ ] Ensure no duplicate fingerprints are introduced.

### Task 9: Merge, deployment and readback

**Files:** none beyond prior tasks.

- [ ] Open PR from `powerhouse/assurance-layer-v1` to `main`.
- [ ] Verify required checks.
- [ ] Merge only when green.
- [ ] Read current main SHA and workflow result after merge.
- [ ] Verify public/production surfaces affected by the change still pass existing production checks.

### Task 10: Canonical Powerhouse writeback

**Files/Systems:**
- Powerhouse Canonical System Map & Agent Update Contract.
- Powerhouse Menselijk Handboek.
- Latest Verified State / relevant component record.
- Existing learning/error/outcome lineage where writable.

- [ ] Document component registry, coverage gate, drift model, Portal parity and recovery semantics.
- [ ] Record exact merged SHA/check evidence and unresolved gaps.
- [ ] Re-fetch Notion pages to prove writeback.
- [ ] End with one hard status: `LIVE & BEWEZEN`, `DEELS LIVE`, `GEBLOKKEERD`, or `NIET GEDAAN`, with concrete evidence.