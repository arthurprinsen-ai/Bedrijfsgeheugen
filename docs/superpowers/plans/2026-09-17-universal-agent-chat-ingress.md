# Universal Agent/Chat Ingress v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make canonical learning-preflight evidence mandatory and identity-bound for every Powerhouse-managed material Agent Fabric execution and terminal completion.

**Architecture:** Reuse the existing chat-learning preflight and universal completion gate. Add a small runtime ingress module that creates an immutable content-addressed receipt, bind Agent Fabric material commands to that ingress adapter, and fail closed when evidence or identity continuity is missing. No second memory or execution plane is introduced.

**Tech Stack:** Node.js 22 ESM, node:test, JSON policy contracts, existing Agent Fabric gateway.

**Spec:** `docs/superpowers/specs/2026-09-17-universal-agent-chat-ingress-design.md`

## Global Constraints

- EXISTING_STATE_FIRST / REUSE_FIRST / CANONICAL_INTEGRATION / CLOSED_LOOP.
- No new persistent memory, queue, calendar or business truth store.
- Existing universal completion and control-plane binding remain authoritative.
- Material execution is fail-closed without a READY canonical chat-learning preflight.
- Exact run/candidate/actor identity must survive ingress through postflight.

---

### Task 1: Lock the missing ingress behavior with RED tests

**Files:**
- Create: `tests/brain-universal-completion-ingress.test.mjs`
- Modify: `.github/workflows/shared-agent-memory-tests.yml`

**Interfaces:**
- Consumes: existing `compileChatLearningPreflight`, Agent Fabric gateway, universal completion gate.
- Produces: executable regression contract for runtime ingress and gateway enforcement.

- [ ] Write tests that import the not-yet-existing runtime ingress module, assert required policy actor classes, fail-closed validation, stable receipt digesting, identity continuity, and Agent Fabric command admission.
- [ ] Add the test to Shared Agent Memory CI.
- [ ] Open/update the PR and verify the exact head fails for the expected missing-ingress reason.

### Task 2: Implement the minimal canonical runtime ingress

**Files:**
- Create: `scripts/brain/powerhouse-universal-runtime-ingress.mjs`
- Create: `config/powerhouse-universal-ingress-v1.json`

**Interfaces:**
- Produces: `beginMaterialRun({ runId, actorKind, actorId, candidateId, rootDir, observedAt })` and `completeMaterialRun({ ingressReceipt, manifest })`.

- [ ] Implement input validation and supported actor kinds: `chat`, `agent`, `workflow`, `scheduled`, `portal`, `cockpit`, `edge_function`, `runtime`.
- [ ] Compile the existing canonical preflight and require `status === 'READY'`.
- [ ] Hash stable preflight/identity fields into `preflightDigest` and `receiptDigest`.
- [ ] Freeze the receipt.
- [ ] Validate postflight identity continuity before delegating to `assertUniversalCompletion`.
- [ ] Run the focused test and verify GREEN.

### Task 3: Enforce ingress at the Agent Fabric material command boundary

**Files:**
- Modify: `platform/api/agent-fabric-gateway.mjs`
- Modify: `tests/agent-fabric-gateway.test.mjs`

**Interfaces:**
- `createAgentFabricGateway({ fabric, runtimeIngress })` where `runtimeIngress.beginMaterialRun(payload)` must return a valid receipt.
- Every command payload delivered to Fabric includes `runtimeIngressReceipt`; queries remain unchanged.

- [ ] Add a failing gateway test proving material commands cannot execute without an ingress adapter or valid receipt.
- [ ] Update the gateway to require `runtimeIngress.beginMaterialRun` at construction and call it before every command.
- [ ] Inject the receipt into the immutable command payload.
- [ ] Verify existing query behavior remains unchanged and no execution/raw-memory bypass appears.

### Task 4: Bind repository policy/documentation to the enforced contract

**Files:**
- Modify: `AGENTS.md`
- Modify: `scripts/brain/chat-learning-preflight.mjs`

**Interfaces:**
- Preflight source list includes `config/powerhouse-universal-ingress-v1.json`.
- Agent contract names the runtime ingress as mandatory for material Agent Fabric execution.

- [ ] Add the ingress policy as a mandatory supplemental preflight source.
- [ ] Document that repository/native-chat distinction does not weaken managed Powerhouse execution admission.
- [ ] Re-run focused and shared-memory tests.

### Task 5: Protected PR verification and closure

**Files:**
- No new production files unless a failing required check exposes a real defect.

- [ ] Verify the exact PR head workflows are terminal green.
- [ ] Review changed files and ensure no parallel truth/memory path exists.
- [ ] Merge only with exact expected head SHA.
- [ ] Read back `main` to prove the ingress module, policy, gateway enforcement and CI test are present.
- [ ] Record canonical learning/writeback with root cause, fix, regression rule and evidence.
