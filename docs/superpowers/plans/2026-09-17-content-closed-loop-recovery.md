# Content Closed-Loop Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Powerhouse content operations one canonical closed loop in which green means externally verified outcome, stale provider state is invalidated automatically, personal LinkedIn truth is enforced explicitly, and all channel capabilities are surfaced truthfully.

**Architecture:** Keep Supabase as runtime truth and Notion as planning/audit projection. Reuse the existing orchestrator, publisher, blog queue, Buffer sync and content obligations rather than creating parallel queues. Add a single reconciliation contract that converts provider readback into canonical obligation state and lets guards re-enter the existing loop only when recovery is safe and idempotent.

**Tech Stack:** Supabase Postgres/pg_cron/Edge Functions, Buffer GraphQL, GitHub/BG169, Notion projection, Node test suite.

**Spec:** `AGENTS.md`, `docs/outcome-obligations.md`, `config/outcome-obligations.json`

## Global Constraints

- GREEN MEANS OUTCOME VERIFIED.
- No duplicate publishing; provider state is read before any recovery dispatch.
- Personal LinkedIn remains fail-closed and requires explicit `personal_truth_verified=true` in addition to the existing identity evidence.
- Instagram `sent` is transport-only unless immutable exact-final-media proof exists.
- Notion is not deployment authority.
- Existing canonical queues and delivery lanes are reused; no parallel queue/database/calendar.

---

### Task 1: Regression contracts

**Files:**
- Create: `tests/content-closed-loop-contract.test.mjs`

**Interfaces:**
- Consumes current Edge Function and migration source files.
- Produces release-blocking static contract checks for provider readback, personal truth, capability truth and outcome health.

- [ ] Write failing tests for missing `personal_truth_verified`, stale Buffer 404 invalidation, truthful capability declarations, and outcome-based health.
- [ ] Run the repository `test` required check and verify the new test is red for the current implementation.

### Task 2: Personal truth and provider reconciliation

**Files:**
- Modify: `supabase/functions/bg-pre-publish-review/index.ts`
- Modify: `supabase/functions/powerhouse-content-orchestrator/index.ts`
- Modify: `supabase/functions/powerhouse-social-publisher/index.ts`

**Interfaces:**
- `personal_truth_verified:boolean` becomes mandatory personal evidence.
- Publisher performs provider re-read before trusting scheduled/published state and records stale/missing provider rows as blocked recovery input.

- [ ] Enforce the explicit personal-truth bit at source validation, artifact evidence and final pre-publish review.
- [ ] Reconcile provider state before dispatch/audit and invalidate stale delivery refs rather than leaving `DISPATCHED` green-looking.
- [ ] Keep recovery idempotent and forbid a replacement post when truth evidence is incomplete.

### Task 3: Canonical outcome reconciliation

**Files:**
- Create: `supabase/migrations/20260917_content_closed_loop_reconciliation.sql`

**Interfaces:**
- Produces `powerhouse_reconcile_content_outcomes_v1(p_date date)`.
- Updates `content_publication_obligations` only from canonical artifact/decision/provider evidence.

- [ ] Add deterministic state normalization for stale `DISPATCHED`, provider 404/missing rows, published/live proof and hard blocked states.
- [ ] Update daily guards to call reconciliation before choosing a recovery action.
- [ ] Make health red when obligations are due but not outcome-verified.

### Task 4: Capability truth and missing executors

**Files:**
- Modify: `supabase/functions/powerhouse-content-orchestrator/index.ts`
- Modify relevant canonical executor only when an existing provider integration exists.

**Interfaces:**
- Capability map is read from actual configured integrations/executors, not optimistic constants.

- [ ] Mark Buffer-backed LinkedIn company/personal and blog paths executable only when their canonical executor is present.
- [ ] Keep newsletter, LinkedIn articles and Instagram generation/dispatch explicitly blocked with machine-readable `BLOCKED_HARD_BOUNDARY` until an existing authorized executor/integration is available; never report those as healthy automation.
- [ ] Ensure the one-loop supervisor continues to own and surface those obligations rather than silently `HOLD`ing them.

### Task 5: Production verification and learning writeback

**Files:**
- Update existing Brain learning/incident records through canonical runtime writeback.

- [ ] Required GitHub checks green on exact head SHA.
- [ ] Promote only through BG169.
- [ ] Verify Supabase deployed function versions/migration readback.
- [ ] Run same-day reconciliation and confirm provider truth equals canonical obligation truth.
- [ ] Verify blog live URL, Buffer post state, Instagram proof state, personal LinkedIn truth gate and cockpit summary.
- [ ] Write root cause, fix, evidence and prevention fingerprint back to the canonical Brain.
