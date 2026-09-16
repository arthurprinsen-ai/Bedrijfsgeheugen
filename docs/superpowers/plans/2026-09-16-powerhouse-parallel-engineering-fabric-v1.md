# Powerhouse Parallel Engineering Fabric v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Powerhouse Engineering OS and BRAIN-DELIVERY-v2 with deterministic dependency-aware parallel engineering, affected-test selection, safe cache identities and speculative integration planning.

**Architecture:** Add one pure orchestration module that reads existing delivery policy rather than creating new authority. Store policy in the existing Engineering OS contract, gate it with focused Node tests wired into Required CI, and document the behavior in the existing development operating system.

**Tech Stack:** Node.js ESM, node:test, GitHub Actions, existing BRAIN-DELIVERY-v2 configuration.

**Spec:** `docs/superpowers/specs/2026-09-16-powerhouse-parallel-engineering-fabric-v1-design.md`

## Global Constraints
- `BRAIN-DELIVERY-v2` remains the delivery authority and BG169 remains production promotion authority.
- No new persistent queue, scheduler, datastore, Brain, CRM or Make dependency.
- Unknown material scope fails closed.
- Parallel work must be isolated by path, conflict contract and declared dependency.
- Fast-path selection never replaces protected release/security/production proof.
- Exact candidate identity and production readback remain mandatory.

---

### Task 1: RED orchestration contract

**Files:**
- Create: `tests/brain-parallel-engineering-fabric.test.mjs`

**Interfaces:**
- Consumes: future exports from `scripts/brain/parallel-engineering-fabric.mjs`.
- Produces: executable behavioral contract for planner, affected-test selector and cache identity.

- [ ] Write tests importing `buildExecutionPlan`, `selectAffectedTests`, `buildCacheIdentity` and `buildSpeculativeIntegrations`.
- [ ] Assert independent backend/website tasks share a wave, same-contract tasks serialize, dependencies order waves, unknown material scope fails closed, documentation-only scope uses minimal tests, cache keys are order-independent and speculative combinations exclude conflicts.
- [ ] Push RED commit and prove Required/target test fails because the module is missing.

### Task 2: Minimal orchestration implementation

**Files:**
- Create: `scripts/brain/parallel-engineering-fabric.mjs`
- Modify: `config/powerhouse-engineering-os.json`

**Interfaces:**
- `buildExecutionPlan({workPackages, deliveryConfig, policy}) -> {waves, packages}`
- `selectAffectedTests({paths, deliveryConfig, policy}) -> {profiles, lanes, contracts, failClosed}`
- `buildCacheIdentity(input) -> sha256 hex string`
- `buildSpeculativeIntegrations(plan) -> array`

- [ ] Implement deterministic path-prefix matching against existing lanes/conflict contracts.
- [ ] Implement dependency validation and cycle detection.
- [ ] Implement concurrency grouping with conflict-contract/path/dependency exclusion.
- [ ] Implement affected-test profiles and fail-closed unknown material scope.
- [ ] Implement stable SHA-256 cache identity.
- [ ] Implement deterministic speculative combinations for conflict-free ready packages.
- [ ] Add `parallel_engineering` policy with fingerprint `powerhouse-parallel-engineering-fabric-v1` to Engineering OS.
- [ ] Run focused tests and Engineering OS validator; both must pass.

### Task 3: Required CI and canonical documentation

**Files:**
- Modify: `.github/workflows/required-test.yml`
- Modify: `scripts/brain/powerhouse-engineering-os.mjs`
- Modify: `docs/development-operating-system.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Engineering OS validator must require the new policy fingerprint and Required test wiring.

- [ ] Extend validator to fail closed when parallel engineering policy or Required wiring drifts.
- [ ] Add new test file to Required CI invocation.
- [ ] Document planner -> isolated lanes -> affected tests -> integration queue -> BG169 -> production readback -> writeback.
- [ ] Document that agents/chats must request work packages from this canonical fabric rather than invent parallel schedulers.
- [ ] Run focused Engineering OS and fabric tests.

### Task 4: Learning and operational writeback

**Files:**
- Modify: `docs/development-ledger.md`
- Create: `docs/learning/2026-09-16-parallel-engineering-fabric-v1.md`

**Interfaces:**
- Writeback records root cause, change, evidence, outcome and prevention without creating runtime authority.

- [ ] Record coordination-tax root cause: stale branches, broad retesting and unnecessary reconciliation.
- [ ] Record prevention rule: dependency-aware work packages plus affected testing and exact-candidate merge integration.
- [ ] Link the design fingerprint and production evidence placeholders only to actual observed PR/merge/workflow identities.

### Task 5: Protected delivery and production proof

**Files:** no new runtime authority.

- [ ] Open PR from fresh-main branch with machine-readable Change-Scope and Scope-Budget.
- [ ] Wait for exact-head Required/BRAIN/security/preview gates triggered by GitHub.
- [ ] Diagnose and fix any red gate without weakening it.
- [ ] Merge through protected route only after exact-head green evidence.
- [ ] Read back `main` merge SHA and post-merge workflow status.
- [ ] Verify canonical files on merged SHA contain the fabric fingerprint and Required wiring.
- [ ] Record final evidence in learning/development ledger through a follow-up protected writeback only if the existing delivery flow cannot write runtime evidence automatically.
- [ ] Status is `LIVE & BEWEZEN` only when merge, production/readback and learning writeback are all evidenced.
