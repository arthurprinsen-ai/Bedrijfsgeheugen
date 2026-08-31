# Current Main Gap Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile every 2026-08-30 implementation-status requirement against current `main`, close only real gaps, and produce machine-readable production proof without creating a second Brain.

**Architecture:** `arthurprinsen-ai/Bedrijfsgeheugen`, current `main`, and BRAIN-DELIVERY-v2 remain canonical. Existing Whole Brain services are reused and only missing contracts/evidence are added. Every external producer inherits registration → shared context → validation → promotion → production identity → outcome → verification → cost/security → learning/writeback, while human boundaries remain fail-closed.

**Tech Stack:** JavaScript/Node test runner, JSON contracts, PostgreSQL/Supabase migrations, GitHub Actions, Netlify, Make, Notion, DataForSEO.

**Spec:** `docs/superpowers/specs/2026-08-30-brain-continuous-cicd-v2-design.md`

## Global Constraints

- No second Brain or parallel source of truth.
- Current-main evidence outranks the 2026-08-30 status snapshot.
- Status vocabulary: `PROVEN`, `BUILT_NOT_PROVEN`, `PARTIAL`, `BLOCKED`, `MISSING`.
- No `PROVEN` without exact code/test/runtime or production evidence.
- Do not rebuild capabilities that already exist; close evidence or coverage gaps.
- Human approval boundaries remain for legal/financial commitments, secrets/permissions/security weakening, destructive operations, and paid actions.
- Completion requires registration → tested → exact promoted → production identity verified → runtime/business outcome verified → learning persisted → shared state refreshed.

---

### Task 1: Current-main reconciliation ledger

**Files:**
- Create: `brain/evidence/current-main-gap-reconciliation-2026-08-31.json`
- Create: `tests/brain-current-main-gap-reconciliation.test.mjs`

**Interfaces:**
- Consumes: 2026-08-30 implementation-status requirements and current repository contracts/tests.
- Produces: one machine-readable ledger with every material gap assigned one allowed status, evidence refs, owner, and next action.

- [ ] Write a failing test requiring all twelve historical product gaps plus cockpit/external-producer/completion requirements to appear exactly once.
- [ ] Run the focused test and preserve RED evidence.
- [ ] Add the reconciliation ledger using current-main evidence; never promote an item to `PROVEN` from documentation claims alone.
- [ ] Run focused test GREEN.
- [ ] Commit the smallest safe change.

### Task 2: Universal producer activation contract

**Files:**
- Create or modify: `brain/contracts/external-producer-activation-v1.json`
- Create: `tests/brain-external-producer-activation.test.mjs`

**Interfaces:**
- Consumes: existing BRAIN delivery, shared-context, production identity, cost/security, outcome and learning contracts.
- Produces: mandatory activation fields and fail-closed rules for Make, Notion, Supabase, DataForSEO and future producers.

- [ ] Write failing tests requiring registration, sharedContextRead, validation, promotionAuthority, productionIdentity, outcome, verification, costEvidence, securityEvidence and learningWriteback.
- [ ] Verify RED.
- [ ] Implement only missing universal contract requirements and explicit platform registrations.
- [ ] Verify GREEN and existing shared-memory/delivery suites.
- [ ] Commit.

### Task 3: Production evidence contract

**Files:**
- Create or modify: `brain/contracts/production-evidence-v1.json`
- Create: `tests/brain-production-evidence.test.mjs`

**Interfaces:**
- Consumes: legacy parity registry, RUM/SLO contracts, integration registry, recovery/reconciliation contracts, exact SHA/revision identity.
- Produces: machine-readable proof states for legacy parity, RUM `<1s cached` / `<2s interactive`, integration health/freshness/error/owner/cost/revision, recovery coverage and exact production identity.

- [ ] Write failing tests that distinguish `BUILT_NOT_PROVEN` from `PROVEN` when runtime evidence is absent.
- [ ] Verify RED.
- [ ] Add evidence schema/registry and current evidence entries without fabricating unavailable observations.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 4: Cockpit projection-only invariant

**Files:**
- Create or modify: `brain/contracts/executive-cockpit-projection-v1.json`
- Create: `tests/brain-executive-cockpit-projection.test.mjs`

**Interfaces:**
- Consumes: Graph, Intelligence, Execution, Evidence and Memory canonical services.
- Produces: a projection-only contract forbidding cockpit-owned business truth.

- [ ] Write failing test requiring source classes for Management Summary, health, opportunities, roadmap, actions and timeline and forbidding independent mutation/system-of-record roles.
- [ ] Verify RED.
- [ ] Implement minimum projection-only contract and registration linkage.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 5: Completion gate + learning closure

**Files:**
- Create or modify: `brain/contracts/completion-gate-v1.json`
- Create: `tests/brain-completion-gate-v1.test.mjs`

**Interfaces:**
- Consumes: delivery identity, runtime/business outcome, BG168/BG166 learning persistence and BG167 shared-state refresh evidence.
- Produces: one terminal gate that cannot pass on merge/CI alone.

- [ ] Write failing test requiring every completion stage and explicit rejection of `mergeOnly`, `ciOnly`, `http2xxOnly` and `parentDispatchOnly` proof.
- [ ] Verify RED.
- [ ] Implement minimal gate linked to existing BRAIN-DELIVERY-v2 and learning authority.
- [ ] Verify GREEN and broad Brain regression suite.
- [ ] Commit.

### Task 6: Delivery, production proof and blocker retention

**Files:**
- Modify only evidence/ledger files if observations change.

**Interfaces:**
- Consumes: exact PR head SHA, current `main`, CI, production runtime adapters.
- Produces: verified status transitions; otherwise durable `BLOCKED`/`BUILT_NOT_PROVEN` obligations.

- [ ] Recheck current `main` for file/semantic overlap immediately before delivery.
- [ ] Run required GitHub gates on exact head and inspect failures rather than blind reruns.
- [ ] Merge only when governed gates permit and exact head is known.
- [ ] Verify production identity and runtime/business outcome independently.
- [ ] Keep Supabase production migration as `BLOCKED` until authorized exact migration + readback succeeds; do not bypass permissions.
- [ ] Persist material learnings through canonical BG168→BG166 and verify downstream `learning_persisted`; refresh shared state through BG167/coalesced path.
- [ ] Mark ledger items `PROVEN` only after their own evidence completes.