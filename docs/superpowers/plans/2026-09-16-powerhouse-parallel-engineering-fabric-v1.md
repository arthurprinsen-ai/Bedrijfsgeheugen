# Powerhouse Parallel Engineering Fabric v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Powerhouse Engineering OS and BRAIN-DELIVERY-v2 with deterministic dependency-aware parallel engineering, affected-test selection, safe cache identities and speculative integration planning.

**Architecture:** Add one pure orchestration module that reads existing delivery policy rather than creating new authority. Store the additive fabric policy in its own focused config that explicitly extends the existing Engineering OS/BRAIN delivery authorities, gate it with focused Node tests wired into Required CI, and document the behavior in canonical change/learning docs.

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

- [x] Write tests importing `buildExecutionPlan`, `selectAffectedTests`, `buildCacheIdentity` and `buildSpeculativeIntegrations`.
- [x] Assert independent backend/website tasks share a wave, same-contract tasks serialize, dependencies order waves, unknown material scope fails closed, documentation-only scope uses minimal tests, cache keys are order-independent and speculative combinations exclude conflicts.
- [x] Commit the RED contract before the implementation module exists.

### Task 2: Minimal orchestration implementation

**Files:**
- Create: `scripts/brain/parallel-engineering-fabric.mjs`
- Create: `config/powerhouse-parallel-engineering-fabric.json`

**Interfaces:**
- `buildExecutionPlan({workPackages, deliveryConfig, policy}) -> {waves, packages}`
- `selectAffectedTests({paths, deliveryConfig, policy}) -> {profiles, lanes, contracts, failClosed}`
- `buildCacheIdentity(input) -> sha256 hex string`
- `buildSpeculativeIntegrations(plan) -> array`
- `validateParallelEngineeringFabric() -> {ok,fingerprint,errors}`

- [x] Implement deterministic path-prefix matching against existing lanes/conflict contracts.
- [x] Implement dependency validation and cycle detection.
- [x] Implement concurrency grouping with conflict-contract/path/dependency exclusion.
- [x] Implement affected-test profiles and fail-closed unknown material scope.
- [x] Implement stable SHA-256 cache identity.
- [x] Implement deterministic speculative combinations for conflict-free ready packages.
- [x] Add focused policy fingerprint `powerhouse-parallel-engineering-fabric-v1` that explicitly reuses Engineering OS/BRAIN-DELIVERY-v2/BG169 authority.

### Task 3: Required CI and canonical documentation

**Files:**
- Modify: `.github/workflows/required-test.yml`
- Create: `docs/changes/2026-09-16-powerhouse-parallel-engineering-fabric-v1.md`

**Interfaces:**
- Required CI directly executes the fabric regression contract.

- [x] Add new test file to Required CI invocation.
- [x] Preserve existing lane aggregation semantics while wiring the test.
- [x] Document planner -> isolated lanes -> affected tests -> speculative integration -> protected merge -> BG169 -> production readback -> writeback.
- [x] Document that agents/chats must reuse this fabric instead of inventing parallel schedulers/queues.

### Task 4: Learning and operational writeback

**Files:**
- Create: `docs/learning/2026-09-16-parallel-engineering-fabric-v1.md`

**Interfaces:**
- Writeback records root cause, change, evidence semantics and prevention without creating runtime authority.

- [x] Record coordination-tax root cause: stale branches, broad retesting and unnecessary reconciliation.
- [x] Record prevention rule: dependency-aware work packages plus affected testing and exact-candidate integration.
- [x] Link design fingerprint and PR lineage without inventing production evidence.

### Task 5: Protected delivery and production proof

**Files:** no new runtime authority.

- [x] Open PR from fresh-main branch with machine-readable Change-Scope and Scope-Budget.
- [ ] Make PR ready after implementation/doc scope is stable.
- [ ] Observe exact-head Required/BRAIN/security/preview gates.
- [ ] Diagnose and fix every red gate without weakening it.
- [ ] Merge through protected route only after exact-head green evidence.
- [ ] Read back `main` merge SHA and post-merge workflow/deploy status.
- [ ] Verify canonical files on merged SHA contain the fabric fingerprint and Required wiring.
- [ ] Verify existing Brain/learning delivery path records the outcome; add a protected follow-up writeback only if canonical runtime writeback is absent.
- [ ] Status is `LIVE & BEWEZEN` only when merge, production/readback and learning writeback are all evidenced.
