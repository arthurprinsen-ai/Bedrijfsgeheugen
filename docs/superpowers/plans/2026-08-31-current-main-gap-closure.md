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
- `brain/evidence/current-main-gap-reconciliation-2026-08-31.json`
- `tests/brain-current-main-gap-reconciliation.test.mjs`

- [x] RED-first regression requires every historical gap plus cockpit/completion/learning coverage exactly once.
- [x] Reconciliation ledger added with allowed statuses, evidence refs, owners and next actions.
- [ ] Exact-head CI and production evidence still govern any later status promotion.

### Task 2: Universal producer activation contract

**Files:**
- `brain/contracts/external-producer-activation-v1.json`
- `tests/brain-external-producer-activation.test.mjs`

- [x] One mandatory activation chain for Make, Notion, Supabase, DataForSEO and future producers.
- [x] Provider acceptance, scenario success, HTTP 2xx and write-attempt are explicit non-evidence.
- [x] Human safety boundaries preserved.

### Task 3: Production evidence contract

**Files:**
- `brain/contracts/production-evidence-v1.json`
- `tests/brain-production-evidence.test.mjs`

- [x] Evidence states distinguish `BUILT_NOT_PROVEN`, `PROVEN` and `BLOCKED`.
- [x] Proof classes cover legacy parity, RUM, integration observability, recovery coverage and production identity.
- [x] RUM targets remain `<1s cached` and `<2s interactive` and require window/percentile/time/revision/sample evidence.

### Task 4: Cockpit projection-only invariant

**Files:**
- `brain/contracts/executive-cockpit-projection-v1.json`
- `tests/brain-executive-cockpit-projection.test.mjs`

- [x] Management Summary, health, opportunities, roadmap, actions and timeline read only canonical Graph/Intelligence/Execution/Evidence/Memory truth classes.
- [x] Cockpit cannot own independent business truth or perform direct business mutations.

### Task 5: Completion gate + learning closure

**Files:**
- `brain/contracts/completion-gate-v1.json`
- `tests/brain-completion-gate-v1.test.mjs`

- [x] Terminal DoD requires registered → tested → exact promoted → production identity verified → runtime/business outcome verified → learning persisted → shared state refreshed.
- [x] Merge-only, CI-only, HTTP-2xx-only and parent-dispatch-only proof are rejected.
- [x] BG168 parent success is insufficient without BG166 downstream persistence; BG167 refresh/readback remains required.

### Task 6: Delivery, production proof and blocker retention

- [ ] Recheck current `main` for changed-path and semantic overlap immediately before delivery.
- [ ] Require exact-head GitHub gates and inspect failures rather than blind reruns.
- [ ] Merge only when governed gates permit and exact head is known.
- [ ] Verify exact production identity and runtime/business outcome independently.
- [ ] Keep Supabase production migration `BLOCKED` until authorized migration + production readback succeeds; never bypass permissions.
- [ ] Persist material learnings through canonical BG168→BG166 and verify downstream persistence; refresh shared state through BG167/coalesced path.
