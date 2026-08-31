# PH Agent Caller-Side Materiality Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace unconditional PH01-PH16 BG168 dispatch with one canonical caller-side materiality topology that preserves primary results and blocks unsafe resume.

**Architecture:** The Brain owns one machine-readable template contract and per-agent rollout state. Make agents remain projections of that contract. A deterministic classifier executes before BG168; NON_MATERIAL returns directly, MATERIAL may invoke BG168 once, and learning failure never owns the primary result path. Production remains fail-closed until staging runtime proof and bounded credit evidence exist.

**Tech Stack:** GitHub repository Brain contracts/tests, Node.js test runner, Make scenarios, BG166/BG167/BG168 learning plane.

**Spec:** `docs/superpowers/specs/2026-08-31-ph-agent-materiality-template-design.md`

## Global Constraints

- PH01-PH16 are all currently affected until proven guarded/exempt.
- NON_MATERIAL => 0 BG168 calls.
- MATERIAL => at most 1 BG168 call.
- Primary result survives BG168 unavailable/error.
- No big-bang reactivation.
- No autonomous paid Make-capacity increase.
- Runtime proof cannot be substituted by blueprint/CI green.
- Secrets/capability values never enter learning artifacts.
- 429/5xx mutations require exact readback before retry.

---

### Task 1: Canonical template contract

**Files:**
- Create: `config/ph-agent-materiality-template-v1.json`
- Test: `tests/brain-ph-agent-materiality-template.test.mjs`

**Interfaces:**
- Consumes: 16-agent inventory in `config/make-agent-resume-learning-guard.json`.
- Produces: canonical topology, classifier policy, rollout states and promotion gates.

- [ ] **Step 1:** Write a failing test requiring all 16 scenario IDs, NON_MATERIAL=0, MATERIAL<=1, fail-open primary result, rollout `1,2,4,8,16`, and `resumeAllowed=false` until every required agent is runtime-proven.
- [ ] **Step 2:** Run the test through the repository CI path and verify RED because `config/ph-agent-materiality-template-v1.json` is absent.
- [ ] **Step 3:** Add the minimal JSON contract with exact topology, invariants, rollout sequence and per-agent initial state `UNGUARDED`.
- [ ] **Step 4:** Re-run and require GREEN.
- [ ] **Step 5:** Commit.

### Task 2: Brain preflight linkage

**Files:**
- Modify: `brain/learning/chat-materialization-2026-08-31-v3.json`
- Modify/Test: `tests/chat-to-brain-current-session.test.mjs`

**Interfaces:**
- Consumes: canonical template contract from Task 1.
- Produces: mandatory future-agent visibility of template/promotion blocker.

- [ ] **Step 1:** Add a failing assertion that compiled preflight reaches the materiality template contract and retains its fail-closed blocker.
- [ ] **Step 2:** Verify RED.
- [ ] **Step 3:** Link the template contract from v3 using `linked_learning_sources` without duplicating incident content.
- [ ] **Step 4:** Verify GREEN.
- [ ] **Step 5:** Commit.

### Task 3: Inactive Make canary blueprint verification

**Files:**
- No production files; evidence recorded in Brain after readback.

**Interfaces:**
- Consumes: staging scenario `7165093` and template contract.
- Produces: `GUARDED_BLUEPRINT` evidence only if topology exactly matches.

- [ ] **Step 1:** Read staging scenario blueprint and module mappings; do not activate.
- [ ] **Step 2:** Verify classifier precedes BG168, NON_MATERIAL branch returns direct, MATERIAL branch invokes BG168 once, BG168 error handler returns primary result.
- [ ] **Step 3:** If topology differs, patch staging atomically with `expectedLastEdit`; never patch production.
- [ ] **Step 4:** Exact readback after any mutation. If 429/5xx is ambiguous, read back before retry.
- [ ] **Step 5:** Record state as `GUARDED_BLUEPRINT`, not runtime-proven.

### Task 4: Runtime acceptance when Make capacity permits

**Files:**
- Update Brain evidence only after real Make executions.

**Interfaces:**
- Consumes: inactive canary and safe available Make capacity.
- Produces: runtime acceptance evidence.

- [ ] **Step 1:** Confirm Make is no longer capacity-paused without purchasing capacity autonomously.
- [ ] **Step 2:** Run one NON_MATERIAL canary and compare BG168 execution count before/after; require zero increment and exact primary result.
- [ ] **Step 3:** Run one MATERIAL canary; require at most one BG168 increment and exact primary result.
- [ ] **Step 4:** Prove learning-unavailable path returns exact primary result using a safe staging-only failure condition.
- [ ] **Step 5:** Measure credits per logical outcome and confirm no 429/burst.
- [ ] **Step 6:** Promote canary state to `RUNTIME_PROVEN` only with evidence IDs.

### Task 5: Controlled PH01-PH16 rollout

**Files:**
- Update Make scenarios only in batch sizes `1 → 2 → 4 → 8 → 16`.
- Update `config/ph-agent-materiality-template-v1.json` state/evidence through normal PR delivery.

**Interfaces:**
- Consumes: proven canary topology and acceptance evidence.
- Produces: all required agents guarded and eventually runtime-proven.

- [ ] **Step 1:** Patch one agent atomically; read back exact topology.
- [ ] **Step 2:** Observe bounded runtime evidence before next batch.
- [ ] **Step 3:** Repeat for 2, then 4, then 8, then remaining agents; stop immediately on regression, 429 burst or credit-slope breach.
- [ ] **Step 4:** Preserve primary result path independently for every agent.
- [ ] **Step 5:** Do not resume full service until all required agents satisfy the resume contract.

### Task 6: Final promotion and Brain closure

**Files:**
- Update canonical policy/evidence and outcome obligation after production proof.

**Interfaces:**
- Consumes: 16-agent runtime evidence.
- Produces: auditable resume authorization.

- [ ] **Step 1:** Re-run Shared Agent Memory, classifier, Brain foundation and BRAIN delivery on exact candidate SHA.
- [ ] **Step 2:** Recheck current `main` for file/semantic/contract overlap.
- [ ] **Step 3:** Merge only with exact-head protection.
- [ ] **Step 4:** Read back canonical `main`.
- [ ] **Step 5:** Only then set resume state to allowed and perform staged service reactivation.
