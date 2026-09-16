# Engineering Intelligence & Trust v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add verifiable supply-chain trust, isolated candidate identity and self-optimising engineering intelligence to BRAIN-DELIVERY-v2.

**Architecture:** Extend the existing delivery control plane and Brain lineage rather than creating parallel systems. Security/provenance and candidate mismatch fail closed; historical engineering debt uses baseline-and-ratchet governance.

**Tech Stack:** GitHub Actions, Node.js ESM, GitHub artifact attestations, SPDX/CycloneDX SBOM, CodeQL/dependency-review, Netlify, Supabase preview branches, existing Brain/BG166-BG169 contracts.

**Spec:** `docs/superpowers/specs/2026-09-16-engineering-intelligence-trust-v1-design.md`

## Global Constraints
- Preserve `BRAIN-DELIVERY-v2` and BG169 as the sole production authority.
- Reuse BG166/BG167/BG168 lineage and the existing component registry.
- No parallel analytics store, delivery authority, learning loop or component registry.
- Exact candidate identity is mandatory for integration evidence.
- New security/provenance/candidate mismatches fail closed.
- Existing dependency/performance/reliability debt is baselined and ratcheted.
- Every production-affecting change requires rollback readiness and exact production readback.

---

### Task 1: Supply-chain trust contract and ownership
**Files:** Create `.github/CODEOWNERS`, `.github/dependabot.yml`, `config/engineering-trust.json`, `tests/engineering-trust-contract.test.mjs`; modify `config/brain-delivery-system.json`.
**Interfaces:** Produces canonical ownership, dependency policy and trust requirements consumed by Required/Assurance.
- [ ] Write contract tests that require CODEOWNERS coverage, Dependabot configuration, provenance/SBOM/dependency-review/CodeQL requirements and BRAIN-DELIVERY-v2 linkage.
- [ ] Run the focused test and verify RED because the trust files/fields do not exist.
- [ ] Add the minimal machine-readable trust policy, CODEOWNERS and Dependabot configuration and extend the delivery config.
- [ ] Run the focused test and verify GREEN.
- [ ] Commit the task.

### Task 2: Provenance, SBOM and security workflows
**Files:** Create `.github/workflows/engineering-supply-chain-trust.yml`, `.github/workflows/codeql.yml`, `tests/engineering-supply-chain-workflows.test.mjs`.
**Interfaces:** Consumes `config/engineering-trust.json`; produces artifact digest, SBOM and attestation/security evidence keyed to SHA.
- [ ] Write tests that parse workflows and require least-privilege permissions, CodeQL, dependency review, SBOM generation and artifact attestation bound to the workflow SHA.
- [ ] Run focused tests and verify RED.
- [ ] Add minimal workflows using official GitHub actions and explicit permissions.
- [ ] Run focused tests and verify GREEN.
- [ ] Commit the task.

### Task 3: Immutable candidate environment identity
**Files:** Create `brain/contracts/candidate-environment-v1.schema.json`, `tools/delivery/candidate-environment.mjs`, `tests/candidate-environment.test.mjs`; modify `config/brain-delivery-system.json` and the unified delivery workflow.
**Interfaces:** `validateCandidateEnvironment(candidate)` returns a fail-closed validation result; candidate binds change/PR/SHA/Netlify/Supabase/schema/artifact/evidence identities.
- [ ] Write tests for complete matching identity, missing identity, SHA mismatch, schema mismatch and preview/backend mismatch.
- [ ] Run focused tests and verify RED.
- [ ] Implement schema and minimal validator, then wire it into delivery preflight.
- [ ] Run focused tests and verify GREEN.
- [ ] Commit the task.

### Task 4: Supabase PR preview contract
**Files:** Create `config/supabase-preview-policy.json`, `.github/workflows/supabase-pr-preview.yml`, `tests/supabase-preview-contract.test.mjs`.
**Interfaces:** Produces Supabase branch/schema evidence consumed by candidate identity; no production credentials are accepted as preview evidence.
- [ ] Write tests requiring PR-scoped branch identity, migration/config ordering, RLS/auth/contract checks, cleanup semantics and candidate evidence output.
- [ ] Run focused tests and verify RED.
- [ ] Implement the preview workflow contract with secret-dependent execution fail-closed at the external boundary and deterministic evidence structure.
- [ ] Run focused tests and verify GREEN.
- [ ] Commit the task.

### Task 5: Graph-driven test selection and safety kernel
**Files:** Create `config/engineering-test-graph.json`, `tools/ci/select-tests.mjs`, `tests/engineering-test-selection.test.mjs`; modify unified delivery workflow.
**Interfaces:** `selectTests(changedPaths, graph)` returns impacted tests plus mandatory safety kernel; unknown paths fall back to conservative full lane coverage.
- [ ] Write tests for dependency impact, safety kernel inclusion and unknown-path fallback.
- [ ] Verify RED.
- [ ] Implement minimal deterministic graph traversal and workflow integration.
- [ ] Verify GREEN and compare selected/full coverage on representative changes.
- [ ] Commit the task.

### Task 6: Flaky-test intelligence
**Files:** Create `config/flaky-test-policy.json`, `tools/ci/flaky-test-intelligence.mjs`, `tests/flaky-test-intelligence.test.mjs`.
**Interfaces:** Converts test observations into reliability score/fingerprint/runtime/retry/regression-catch/owner evidence and emits existing Brain material outcomes.
- [ ] Write tests for fingerprint stability, reliability scoring, quarantine threshold, owner requirement and no silent retry masking.
- [ ] Verify RED.
- [ ] Implement minimal scoring and BG166/BG168-compatible outcome generation.
- [ ] Verify GREEN.
- [ ] Commit the task.

### Task 7: Performance and cost budgets
**Files:** Create `config/engineering-performance-budgets.json`, `tools/ci/performance-budget-gate.mjs`, `tests/performance-budget-gate.test.mjs`.
**Interfaces:** Evaluates current measurement versus baseline/absolute budget/ratchet and returns PASS, REGRESSION_BLOCK or BASELINE_DEBT.
- [ ] Write tests for bundle, Web Vitals, API latency, DB latency, Edge cold start, query count, memory, token and euro budgets including 40% regression blocking.
- [ ] Verify RED.
- [ ] Implement budget evaluator with baseline-and-ratchet semantics.
- [ ] Verify GREEN.
- [ ] Commit the task.

### Task 8: Engineering telemetry and scorecard
**Files:** Create `config/engineering-scorecard.json`, `tools/engineering/scorecard.mjs`, `tests/engineering-scorecard.test.mjs`, `docs/engineering-scorecard.md`.
**Interfaces:** Projects existing events/CI evidence into deployment frequency, lead time, change failure rate, recovery time, queue/test time, flaky rate, security debt, freshness, preview coverage, rollback readiness and documentation drift.
- [ ] Write projection tests using deterministic event fixtures and explicit metric definitions.
- [ ] Verify RED.
- [ ] Implement projection without introducing a new source-of-truth store.
- [ ] Verify GREEN.
- [ ] Commit the task.

### Task 9: Rollback and recovery proof
**Files:** Create `config/rollback-proof-policy.json`, `tools/delivery/rollback-proof.mjs`, `tests/rollback-proof.test.mjs`; modify delivery config/workflow.
**Interfaces:** Requires recent proof for Netlify restore, migration recovery, Edge/config rollback and restore drills; destructive drills remain blocked behind safe test environments.
- [ ] Write tests for proof freshness, missing proof, stale proof and safe-environment restriction.
- [ ] Verify RED.
- [ ] Implement proof evaluator and gate integration.
- [ ] Verify GREEN.
- [ ] Commit the task.

### Task 10: Multi-agent work graph and leases
**Files:** Create `brain/contracts/engineering-work-graph-v1.schema.json`, `tools/engineering/work-graph.mjs`, `tests/engineering-work-graph.test.mjs`; modify delivery config.
**Interfaces:** Acquire/renew/release lease by component/authority/change ID; detect path, contract and dependency conflicts before writes; stale leases recover deterministically.
- [ ] Write tests for independent leases, conflicting authority, dependency conflict and stale recovery.
- [ ] Verify RED.
- [ ] Implement deterministic lease/conflict model integrated with existing lane/conflict contracts.
- [ ] Verify GREEN.
- [ ] Commit the task.

### Task 11: Unified Required/Assurance gate and documentation
**Files:** Modify `.github/workflows/unified-brain-delivery.yml`, `AGENTS.md`, human-readable Engineering OS/Powerhouse docs and canonical register; create `tests/engineering-intelligence-trust-integration.test.mjs`.
**Interfaces:** One fail-closed gate consumes trust, candidate, tests, flaky, budgets, rollback and work-graph evidence and writes current state/outcomes through existing Brain lineage.
- [ ] Write integration test requiring every new evidence class and canonical documentation fingerprint.
- [ ] Verify RED.
- [ ] Wire all evidence into Required/Assurance and update agent/human documentation and State-of-the-Art Adoption status.
- [ ] Verify focused and full relevant suites GREEN.
- [ ] Commit the task.

### Task 12: Preview, merge, production readback and learning writeback
**Files:** No parallel system; use existing BG169 promotion, Netlify/Supabase preview evidence, BG166/BG167/BG168 and development ledger.
**Interfaces:** Produces exact candidate-to-production lineage and final hard status.
- [ ] Open PR from the isolated branch and collect exact-head Required/Assurance evidence.
- [ ] Repair any red gate using the self-healing loop; never weaken a gate to obtain green.
- [ ] Merge only the exact verified head through the existing authority.
- [ ] Verify main SHA, production deploy/readback and scorecard/current-state projection.
- [ ] Write root cause/implementation/evidence/outcome/prevention to BG166/BG168 and update human-readable documentation.
- [ ] Finish only as LIVE & BEWEZEN, DEELS LIVE, GEBLOKKEERD or NIET GEDAAN with exact evidence.
