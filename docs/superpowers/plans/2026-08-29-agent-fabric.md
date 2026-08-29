# Agent Fabric Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one governed Agent Fabric so all Bedrijfsgeheugen specialist agents coordinate through shared AgentWork, evidence, learning and improvement signals.

**Architecture:** Add a small coordination layer above existing `agent-work.mjs` and Brain Runtime. The Fabric owns registry/routing, deduplication, shared learning and opportunity intake, but never executes external changes itself; execution remains exclusively in Brain Runtime.

**Tech Stack:** Node.js ES modules, `node:test`, existing canonical event/AgentWork/Brain modules, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-29-agent-fabric-design.md`

## Global Constraints
- Company Graph + Canonical State remain the only Business Truth.
- Agent learning is tenant-scoped and only persisted after verification.
- AI Interpretation never silently becomes Business Truth.
- High-risk/high-blast-radius execution continues to require existing Brain policy/autonomy controls.
- No agent can directly execute external changes through Agent Fabric.
- Existing Brain Acceptance, Trust, Foundation, production AI and portal parity gates must remain green.

---

### Task 1: Agent Registry and Cross-Domain Router

**Files:**
- Create: `platform/agents/agent-registry.mjs`
- Test: `tests/agent-fabric.test.mjs`

**Interfaces:**
- Produces: `createAgentRegistry(agents)`, `registry.route({ domains, capabilities })` returning `{ primaryAgentId, supportAgentIds }`.

- [ ] **Step 1: Write failing tests** for deterministic primary owner selection, support-agent attachment and failure when no eligible agent exists.
- [ ] **Step 2: Run** `node --test tests/agent-fabric.test.mjs`; expect missing-module/function failure.
- [ ] **Step 3: Implement minimal registry/router** with unique agent IDs, normalized domains/capabilities and deterministic scoring.
- [ ] **Step 4: Run test** and expect PASS.
- [ ] **Step 5: Commit** registry + tests.

### Task 2: Shared AgentWork Deduplication and Coordination

**Files:**
- Create: `platform/agents/agent-fabric.mjs`
- Modify: `tests/agent-fabric.test.mjs`

**Interfaces:**
- Consumes: `createAgentRegistry`, `createAgentWork`.
- Produces: `createAgentFabric({ registry, now })` with `intake(signal)`, `getWork(id)`, `listWork({ tenantId })`, `transition(input)`.

- [ ] **Step 1: Add failing tests** proving duplicate tenant/problem/object fingerprints return the same active work item and cross-domain intake adds support agents.
- [ ] **Step 2: Run test** and verify RED.
- [ ] **Step 3: Implement normalized fingerprinting, shared work registry, lifecycle transition validation and immutable returned values.**
- [ ] **Step 4: Run tests** and expect PASS.
- [ ] **Step 5: Commit.**

### Task 3: Verified Shared Learning and Reuse

**Files:**
- Create: `platform/agents/learning-memory.mjs`
- Modify: `platform/agents/agent-fabric.mjs`
- Modify: `tests/agent-fabric.test.mjs`

**Interfaces:**
- Produces: `createLearningMemory()` with `recordVerified(record)`, `findMatches({ tenantId, domains, fingerprint })`, `markReused(id)`.
- Agent Fabric adds `recordLearning(input)` and `suggestLearning({ workId })`.

- [ ] **Step 1: Add failing tests** proving unverified learning is rejected, another specialist can reuse verified learning, reuse count increments, and tenant B cannot see tenant A learning.
- [ ] **Step 2: Run test** and verify RED.
- [ ] **Step 3: Implement tenant-scoped verified learning memory and Fabric integration.**
- [ ] **Step 4: Run tests** and expect PASS.
- [ ] **Step 5: Commit.**

### Task 4: Proactive Opportunity / Continuous Improvement Intake

**Files:**
- Modify: `platform/agents/agent-fabric.mjs`
- Modify: `tests/agent-fabric.test.mjs`

**Interfaces:**
- Produces: `intakeOpportunity(signal)` using the same work lifecycle and router as failures; returns prioritized AgentWork.

- [ ] **Step 1: Add failing tests** for cost-reduction/SEO/performance opportunities using the same lifecycle and deterministic priority.
- [ ] **Step 2: Run test** and verify RED.
- [ ] **Step 3: Implement opportunity normalization and priority scoring from materiality, urgency, expected value, risk and confidence.**
- [ ] **Step 4: Run tests** and expect PASS.
- [ ] **Step 5: Commit.**

### Task 5: Brain Boundary and No-Bypass Contract

**Files:**
- Create: `platform/api/agent-fabric-gateway.mjs`
- Create: `tests/agent-fabric-gateway.test.mjs`

**Interfaces:**
- Produces: `createAgentFabricGateway({ fabric })` exposing only intake/query/transition/learning functions; deliberately no `execute` method.

- [ ] **Step 1: Add failing tests** proving the gateway exposes collaboration/query operations but cannot execute an external command and cannot expose internals.
- [ ] **Step 2: Run test** and verify RED.
- [ ] **Step 3: Implement explicit allowlisted gateway.**
- [ ] **Step 4: Run tests** and expect PASS.
- [ ] **Step 5: Commit.**

### Task 6: CI Acceptance Gate

**Files:**
- Modify: `.github/workflows/business-os-intelligence.yml`
- Modify: `.github/workflows/shared-agent-memory-tests.yml` if present and compatible.

**Interfaces:**
- Adds mandatory `node --test tests/agent-fabric.test.mjs tests/agent-fabric-gateway.test.mjs` before existing Brain/Trust/Foundation/parity gates.

- [ ] **Step 1: Update workflow to include Agent Fabric contract tests.**
- [ ] **Step 2: Open PR and run exact-SHA CI.**
- [ ] **Step 3: Verify Agent Fabric + Brain Acceptance + production AI + Trust + Foundation + portal parity + shared memory all green.**
- [ ] **Step 4: Verify Netlify deploy-preview if affected.**
- [ ] **Step 5: Merge only exact green head after stale-main check.**

### Task 7: Production Verification

**Files:** No source changes unless a production-only defect is discovered.

- [ ] **Step 1: Verify merged `main` SHA.**
- [ ] **Step 2: Verify Netlify production deploy points to exact merge SHA and is `ready`.**
- [ ] **Step 3: Verify no existing five production functions disappeared and secret scan remains clean.**
- [ ] **Step 4: Record completion only after exact-SHA evidence is green.**
