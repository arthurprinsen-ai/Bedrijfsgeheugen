# Powerhouse Delivery Kernel / One Loop v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let 10+ agents develop concurrently while keeping integration, merge, deploy and recovery bounded, deterministic and self-healing.

**Architecture:** Extend the existing One Loop and delivery hygiene rather than introducing another control plane. Separate development concurrency from integration pressure, add bounded stale-queue reconciliation, narrow duplicate PR workflow fan-out and enforce the result with a machine-readable workflow budget contract.

**Tech Stack:** Node.js ESM, node:test, GitHub Actions, existing Powerhouse Brain/delivery control plane.

**Spec:** `docs/superpowers/specs/2026-09-17-powerhouse-delivery-kernel-v2-design.md`

## Global Constraints
- No second brain, database, queue, scheduler, calendar or learning store.
- One obligation has at most one active executable candidate.
- Development concurrency must not be capped by integration WIP.
- Security, integrity, truth, protected-main, release and production-evidence gates may not be weakened.
- Recovery is idempotent and exact-identity bound.
- GitHub telemetry is evidence/learning input, never business truth.

---

### Task 1: Separate development from finishing pressure
- [x] Preserve finish-before-start when promotion/recovery is active.
- [x] Admit independent implementation candidates even when more than five are open.
- [x] Add regression coverage to `tests/delivery-one-loop-v1.test.mjs`.

### Task 2: Bounded stale queue recovery
- [x] Extend `evaluateGitHubQueueRecovery(snapshot, now)` with a stale threshold.
- [x] Transition stale queued work to `RECONCILING/RECOVER` without blind retry.
- [x] Preserve ordinary queued/in-progress as nonterminal WAIT below the threshold.

### Task 3: Reduce duplicate PR fan-out
- [x] Scope generic CodeQL PR analysis to Python only.
- [x] Keep Powerhouse CodeQL as JavaScript/TypeScript PR authority.
- [x] Remove duplicate pull-request triggers from Brain foundation, Shared Agent Memory, BG168 promotion, learning classifier and Engineering Intelligence workflows; their required contracts remain covered by Required/automation lanes.

### Task 4: Prevent regression
- [x] Add `config/powerhouse-pr-workflow-budget-v1.json`.
- [x] Assert one canonical Required orchestrator, uncapped development and reconcile-before-retry semantics.
- [x] Keep exact-head, protected merge, security, truth and production evidence fail-closed.

### Task 5: Exact-head verification and closure
- [ ] Verify Required and selected lanes on the final exact head.
- [ ] Confirm new head starts materially fewer PR workflows than the pre-fix 12-run fan-out.
- [ ] Merge only with expected exact head after terminal required gates are green.
- [ ] Read back main and production evidence before LIVE_PROVEN/FULFILLED claims.
