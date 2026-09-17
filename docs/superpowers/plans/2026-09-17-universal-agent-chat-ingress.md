# Universal Agent/Chat Ingress v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make canonical learning-preflight evidence mandatory and identity-bound for every Powerhouse-managed material Agent Fabric execution and terminal completion.

**Architecture:** Reuse the existing chat-learning preflight and universal completion gate. The Agent Fabric gateway imports the canonical runtime ingress directly; callers cannot inject an alternate ingress implementation. No second memory or execution plane is introduced.

**Tech Stack:** Node.js 22 ESM, node:test, JSON policy contracts, existing Agent Fabric gateway.

**Spec:** `docs/superpowers/specs/2026-09-17-universal-agent-chat-ingress-design.md`

## Global Constraints

- EXISTING_STATE_FIRST / REUSE_FIRST / CANONICAL_INTEGRATION / CLOSED_LOOP.
- No new persistent memory, queue, calendar or business truth store.
- Existing universal completion and control-plane binding remain authoritative.
- Material execution is fail-closed without a READY canonical chat-learning preflight.
- Exact run/candidate/actor identity must survive ingress; run/candidate continuity is revalidated at postflight.
- Native ChatGPT runtime itself is outside repository control; any material Powerhouse mutation invoked from it must still cross the managed Powerhouse ingress/control-plane.

### Task 1: Lock missing ingress behavior with RED tests

**Files:** `tests/brain-universal-completion-ingress.test.mjs`, `.github/workflows/shared-agent-memory-tests.yml`

- [x] Add regression tests for policy coverage, invalid identities, deterministic receipt digests, postflight continuity and Agent Fabric admission.
- [x] Add the ingress test to Shared Agent Memory CI.
- [x] Prove RED on head `63357c00aa129602dd3b721191a3746da2ed8592`: Shared Agent Memory Tests and BRAIN delivery failed while the old chat-learning preflight remained green.

### Task 2: Implement canonical runtime ingress

**Files:** `scripts/brain/powerhouse-universal-runtime-ingress.mjs`, `config/powerhouse-universal-ingress-v1.json`

- [x] Validate required run, actor and candidate identity plus supported actor classes.
- [x] Compile the existing canonical preflight and require `READY`.
- [x] Create stable SHA-256 preflight/receipt digests and freeze the receipt.
- [x] Validate exact run/candidate postflight continuity before delegating to `assertUniversalCompletion`.

### Task 3: Enforce ingress at Agent Fabric mutation boundary

**Files:** `platform/api/agent-fabric-gateway.mjs`, `tests/agent-fabric-gateway.test.mjs`

- [x] Import canonical `beginMaterialRun()` directly in the gateway; no injectable alternate adapter.
- [x] Reject unsupported operations before admission.
- [x] Require runtime identity before every supported material command.
- [x] Inject the canonical receipt into the immutable mutation payload.
- [x] Keep read-only queries unchanged and expose no raw execution/internal-memory bypass.

### Task 4: Bind preflight and learning to the enforced contract

**Files:** `scripts/brain/chat-learning-preflight.mjs`, `brain/learning/universal-runtime-ingress-2026-09-17.json`

- [x] Add the ingress policy as a mandatory supplemental source.
- [x] Validate ACTIVE/default-enabled/fail-closed state, complete actor coverage and runtime/completion entrypoint existence.
- [x] Record root cause, failed approach, fix and prevention as canonical learning and link it into the same preflight.
- [x] Preserve the existing `AGENTS.md` mandatory-preflight contract; no duplicate agent instruction layer is introduced.

### Task 5: Protected verification and closure

- [ ] Verify exact final PR-head workflows are terminal green.
- [x] Review full diff for parallel truth/memory paths and documentation drift; harden away injectable ingress substitution.
- [ ] Merge only with exact expected head SHA after required gates are green.
- [ ] Read back `main` for the ingress module, policy, gateway enforcement and CI test.
