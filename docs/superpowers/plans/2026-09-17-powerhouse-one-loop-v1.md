# Powerhouse One Loop v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Powerhouse Brain/delivery control-plane so every material obligation is durable, recoverable, finishing-first, evidence-closed and continuously learned from GitHub/runtime telemetry.

**Architecture:** Reuse POWERHOUSE-DELIVERY-HYGIENE-v1, the existing Brain delivery system, universal ingress/control-plane bindings and completion/readback contracts. Add policy and pure decision logic for canonical lifecycle/terminal-state enforcement, recovery leases, finishing pressure and GitHub telemetry normalization; wire it into existing protected workflows without creating a parallel queue or source of truth.

**Tech Stack:** Node.js ESM tooling/tests, GitHub Actions, existing Powerhouse Brain/control-plane, Supabase-backed canonical state where already used.

**Spec:** `docs/superpowers/specs/2026-09-17-powerhouse-one-loop-v1-design.md`

## Global Constraints

- No second brain, database, queue, scheduler, calendar, learning store or business-truth store.
- One obligation has at most one active executable candidate.
- `committed`, open PR, queued CI, timeout, chat/model stop, worker loss and lease expiry are never valid terminal completion states.
- Security, integrity, truth, branch protection, release and evidence gates may not be weakened.
- Recovery must be idempotent and exact-identity bound.
- GitHub telemetry is evidence/learning input, never business truth.

---

### Task 1: One Loop policy and lifecycle contract

**Files:**
- Create: `config/powerhouse-one-loop-v1.json`
- Create: `tools/delivery/one-loop.mjs`
- Test: `tests/powerhouse-one-loop-contract.test.mjs`

**Interfaces:**
- Produces `classifyTerminalState(state, evidence)` returning `{terminal, valid, recoveryRequired, reason}`.
- Produces `evaluateExecutionLease(run, now)` returning `HEALTHY | RECOVER | TERMINAL`.
- Produces `evaluateFinishingPressure(snapshot)` returning admission guidance without creating a queue.

- [ ] Write failing contract tests for invalid committed/PR/CI/interruption terminal states, valid LIVE_PROVEN/FULFILLED and evidence-bound BLOCKED_EXTERNAL.
- [ ] Run the focused test and confirm RED because One Loop module/config do not exist.
- [ ] Implement minimal pure decision logic and policy config.
- [ ] Run focused test and confirm GREEN.
- [ ] Commit.

### Task 2: Finish-before-start delivery admission

**Files:**
- Modify: `config/powerhouse-delivery-hygiene-v1.json`
- Modify: `tools/delivery/delivery-hygiene.mjs`
- Test: `tests/delivery-hygiene-admission.test.mjs` and/or a focused One Loop integration contract.

**Interfaces:**
- Consumes One Loop finishing pressure.
- Produces deterministic `WAITING_CAPACITY`/block decision for lower-priority new work when admitted work is in finishing stages and capacity is saturated.

- [ ] Add failing tests proving finishing work outranks new implementation, while security/incident priority remains gate-bound.
- [ ] Verify RED.
- [ ] Implement minimal integration into existing hygiene decision path.
- [ ] Verify focused and existing delivery-hygiene tests GREEN.
- [ ] Commit.

### Task 3: Durable recovery/reconciliation contract

**Files:**
- Modify/create focused existing completion/control-plane module under `tools/delivery/` according to repository pattern.
- Test: focused One Loop recovery tests.

**Interfaces:**
- Consumes canonical obligation/run/candidate identity, heartbeat/lease and observed execution evidence.
- Produces exactly one of `NOOP_TERMINAL`, `CONTINUE`, `RECOVER`, `BLOCK_EXTERNAL`, `REVIEW_REQUIRED`.

- [ ] Add failing tests for stale lease, stopped chat/worker, duplicate active candidate, already-applied side effect and idempotent replay.
- [ ] Verify RED.
- [ ] Implement pure reconciliation decision logic reusing canonical candidate ownership.
- [ ] Verify GREEN and no duplicate-candidate regression.
- [ ] Commit.

### Task 4: GitHub telemetry learning normalization

**Files:**
- Create: `tools/delivery/github-learning.mjs`
- Test: `tests/powerhouse-github-learning.test.mjs`

**Interfaces:**
- `normalizeGitHubDeliveryTelemetry(input)` returns deterministic evidence metrics/fingerprints for queueing, reruns, conflicts, supersession, moving-main churn and obligation-to-live/fulfilled latency.
- No external write store is introduced.

- [ ] Add failing tests for deterministic normalization and repeat-failure fingerprint reuse.
- [ ] Verify RED.
- [ ] Implement minimal normalization/fingerprint logic.
- [ ] Verify GREEN.
- [ ] Commit.

### Task 5: Protected workflow wiring

**Files:**
- Modify: `.github/workflows/powerhouse-delivery-hygiene.yml`
- Modify: `.github/workflows/unified-brain-delivery.yml`
- Modify: `.github/workflows/required-test.yml` only if needed to include new contract tests without changing protected `test` authority.
- Test: existing workflow-wiring tests plus focused One Loop wiring test.

**Interfaces:**
- Cheap One Loop/admission validation runs before expensive work.
- Recheck runs before handoff/promotion.
- Existing required `test` aggregator remains authoritative.

- [ ] Add failing wiring assertions first.
- [ ] Verify RED through repository tests/CI.
- [ ] Wire One Loop preflight and recheck using existing workflows.
- [ ] Verify required and delivery gates GREEN.
- [ ] Commit.

### Task 6: Canonical learning and backlog reconciliation

**Files:**
- Create/update existing `brain/learning/` and `docs/learning/` companion according to canonical writeback-idempotency rules.
- Use existing repository janitor/delivery-hygiene surfaces for backlog readback; no new cleanup queue.

**Interfaces:**
- One reusable failure fingerprint lineage for stranded-commit/PR/timeout/work-loss recurrence.
- Evidence links to exact PR/head/workflow outcomes.

- [ ] Add/extend learning only if semantics/evidence are new; otherwise reconcile idempotently.
- [ ] Run janitor dry-run/classification and record deterministic safe actions versus REVIEW_REQUIRED.
- [ ] Ensure one active executable candidate per obligation for the One Loop implementation itself.
- [ ] Commit canonical writeback.

### Task 7: Release and proof

**Files:**
- No new architecture files unless a proven regression requires them.

**Interfaces:**
- Exact-head required checks terminal green.
- Protected merge to current `main`.
- Main/readback proves One Loop code and workflow wiring present.
- Canonical learning records final evidence/outcome.

- [ ] Recheck current main and exact candidate identity.
- [ ] Resolve moving-main/conflict without weakening gates.
- [ ] Merge only after protected checks are terminal green.
- [ ] Read back merged files/workflows from `main`.
- [ ] Confirm no duplicate active One Loop candidate/debris remains.
- [ ] Record final status as `LIVE & BEWEZEN` only with evidence; otherwise continue recovery or return `GEBLOKKEERD` with exact external blocker and recovery path.
