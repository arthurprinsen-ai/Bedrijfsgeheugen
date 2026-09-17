# Powerhouse Fast Development Protocol v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Powerhouse development incremental and event-driven by adding Execution Packet v2, delta context, deterministic classification/no-op detection, impact-based testing, exact-identity evidence reuse, parallel execution DAGs, delta writeback and lead-time telemetry without weakening BRAIN-DELIVERY-v2 or LIVE & BEWEZEN.

**Architecture:** Extend `powerhouse-fast-execution.mjs` for preflight/context/dedupe/cache/telemetry primitives and `parallel-engineering-fabric.mjs` for dependency-aware impact/DAG planning. Register the protocol in the existing Engineering OS; keep BG169/BRAIN-DELIVERY-v2 as the only production authority and exact-SHA production readback uncached.

**Tech Stack:** Node.js 22 ESM, `node:test`, JSON policy contracts, GitHub Actions Required test.

**Spec:** `docs/superpowers/specs/2026-09-17-powerhouse-fast-development-protocol-v2-design.md`

## Global Constraints
- Canonical fingerprint: `powerhouse-fast-development-protocol-v2`.
- Execution classes are exactly `FAST`, `STANDARD`, `CRITICAL`, `WAITING_EXTERNAL`.
- Unknown material scope fails closed to full required tests/gates.
- Cache identity includes candidate SHA, environment, config/schema/dependency/test-or-gate/contract identity.
- Exact-SHA production readback is never cacheable.
- No second Brain, delivery authority, queue, registry, CurrentState or learning store.
- Production promotion remains BG169/BRAIN-DELIVERY-v2 and success remains `LIVE & BEWEZEN`.

---

### Task 1: Fast protocol primitives and Execution Packet v2

**Files:**
- Modify: `tests/brain-fast-execution.test.mjs`
- Modify: `scripts/brain/powerhouse-fast-execution.mjs`

**Interfaces:**
- Produces `classifyTask()`, `buildExecutionPacketV2()`, `computeDeltaContext()`, `detectNoOp()`, `buildEvidenceIdentity()`, `EvidenceCache`, `buildDeltaWriteback()`, `LatencyTrace`.

- [ ] **Step 1: Write failing tests** for the four execution classes, bounded packet required fields, delta-only context, fail-closed fallback, no-op evidence, exact evidence identity/invalidation, delta writeback and all v2 latency fields.
- [ ] **Step 2: Run** `node --test tests/brain-fast-execution.test.mjs` and confirm RED because v2 exports/semantics do not exist.
- [ ] **Step 3: Implement minimal v2 primitives** in `powerhouse-fast-execution.mjs`, preserving compatibility helpers where safe.
- [ ] **Step 4: Run** `node --test tests/brain-fast-execution.test.mjs` and require PASS.
- [ ] **Step 5: Commit** `feat: add fast development protocol v2 primitives`.

### Task 2: Impact graph and deterministic parallel DAG

**Files:**
- Modify: `tests/brain-parallel-engineering-fabric.test.mjs`
- Modify: `scripts/brain/parallel-engineering-fabric.mjs`
- Modify: `config/powerhouse-parallel-engineering-fabric.json`

**Interfaces:**
- Produces `buildImpactGraph()` and an enriched `buildExecutionPlan()` with resources, mutable-resource conflicts, required targeted tests and cache identity inputs.

- [ ] **Step 1: Write failing tests** proving schema/runtime resources affect impact, unknown scope fails closed, independent packages share a wave, dependency/path/contract/mutable-resource conflicts serialize, and cache identity changes for config/schema/dependency/gate/contract changes.
- [ ] **Step 2: Run** `node --test tests/brain-parallel-engineering-fabric.test.mjs` and confirm RED on new behavior.
- [ ] **Step 3: Implement** impact graph and DAG extensions; update policy to v2 semantics without introducing production authority.
- [ ] **Step 4: Run** `node --test tests/brain-parallel-engineering-fabric.test.mjs` and require PASS.
- [ ] **Step 5: Commit** `feat: add impact graph and parallel execution dag`.

### Task 3: Engineering OS integration and release-boundary invariants

**Files:**
- Modify: `tests/brain-powerhouse-engineering-os-contract.test.mjs`
- Modify: `config/powerhouse-engineering-os.json`
- Modify: `scripts/brain/powerhouse-engineering-os.mjs`
- Modify: `docs/development-operating-system.md`

**Interfaces:**
- Engineering OS exposes `fast_development_protocol.fingerprint === 'powerhouse-fast-development-protocol-v2'` and the canonical flow while preserving `BRAIN-DELIVERY-v2`, protected promotion and production readback.

- [ ] **Step 1: Write failing tests** for protocol discovery, exact flow, four lanes, no-op-before-reasoning, targeted-development/full-release-boundary separation, uncached production readback and delta writeback.
- [ ] **Step 2: Run** `node --test tests/brain-powerhouse-engineering-os-contract.test.mjs` and confirm RED.
- [ ] **Step 3: Add** the protocol block and validator checks; update human OS documentation to the incremental flow.
- [ ] **Step 4: Run** `node --test tests/brain-powerhouse-engineering-os-contract.test.mjs` and require PASS.
- [ ] **Step 5: Commit** `feat: integrate fast development protocol into engineering os`.

### Task 4: Required CI wiring and acceptance contract

**Files:**
- Modify: `.github/workflows/required-test.yml`
- Create: `tests/brain-fast-development-protocol-v2.test.mjs`

**Interfaces:**
- Acceptance test exercises the canonical v2 flow and asserts release-boundary/non-cacheable invariants; Required test executes it.

- [ ] **Step 1: Add failing acceptance test** importing v2 primitives and reading Engineering OS/fabric policy.
- [ ] **Step 2: Wire test into Required test** next to Engineering OS/parallel-fabric contracts.
- [ ] **Step 3: Run** `node --test tests/brain-fast-development-protocol-v2.test.mjs tests/brain-fast-execution.test.mjs tests/brain-parallel-engineering-fabric.test.mjs tests/brain-powerhouse-engineering-os-contract.test.mjs` and require PASS.
- [ ] **Step 4: Commit** `test: enforce fast development protocol v2`.

### Task 5: Protected delivery, exact-SHA proof and delta learning

**Files:**
- Create: `brain/learning/powerhouse-fast-development-protocol-v2-2026-09-17.json`
- Modify only if required by existing canonical writeback contract: `docs/development-ledger.md`

**Interfaces:**
- Learning record contains changed/evidence/outcome/learning/open obligation/timing fields and links exact candidate + production identity.

- [ ] **Step 1: Open PR** from `feat/powerhouse-fast-development-protocol-v2` to `main` with scope metadata required by branch hygiene.
- [ ] **Step 2: Require all selected Required test jobs green** for the exact PR candidate SHA; diagnose/fix any red gate instead of bypassing it.
- [ ] **Step 3: Promote only through existing protected authority**; never direct-push production state.
- [ ] **Step 4: Read back merged `main` identity and production evidence**; exact-SHA production readback may not be satisfied from evidence cache.
- [ ] **Step 5: Persist compact delta learning/writeback** and verify it is discoverable through canonical shared learning.
- [ ] **Step 6: Final status is `LIVE & BEWEZEN` only when protected delivery, production identity/readback and learning writeback all prove the same lineage.
