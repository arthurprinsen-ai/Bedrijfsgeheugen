# Powerhouse Revenue Acceleration Mode v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Increase commercial throughput by turning existing Powerhouse opportunities into safely prepared provider-ready actions, enforcing closed-loop outcome evidence, and automatically promoting or weakening learnings based on measured evidence.

**Architecture:** Add one SQL migration containing three small canonical functions—gate enrichment, learning promotion, and revenue-acceleration orchestration—plus one hourly cron invocation. Reuse all existing Powerhouse tables/views/functions; create no new CRM, queue, datastore, provider layer or learning store.

**Tech Stack:** PostgreSQL/PLpgSQL, Supabase pg_cron, existing Powerhouse runtime tables/views, Node.js contract tests.

**Spec:** `docs/superpowers/specs/2026-09-15-powerhouse-revenue-acceleration-mode-v1-design.md`

## Global Constraints

- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- No Make dependency.
- No synthetic analytics or fabricated outcomes/revenue.
- Maximum 5 newly prepared e-mail/LinkedIn DM outbound actions per Europe/Amsterdam day.
- Exact destination, eligibility, contact pressure, identity, truth and provider capability all remain mandatory.
- Gmail provider capability requires recent verified Gmail provider readback.
- LinkedIn DM remains fail-closed until verified outbound provider evidence exists.
- Realized revenue comes only from observed `powerhouse_sales_outcomes`.

---

### Task 1: Contract tests for Revenue Acceleration Mode

**Files:**
- Create: `tests/supabase-powerhouse-revenue-acceleration-mode-v1.test.mjs`
- Future implementation: `supabase/migrations/20260915143000_powerhouse_revenue_acceleration_mode_v1.sql`

**Interfaces:**
- Consumes: migration SQL text.
- Produces: CI contract covering function names, all six hard gates, Gmail provider readback, LinkedIn fail-closed behavior, learning promotion/demotion, service-role-only execution, hourly cron reuse and canonical runtime learning.

- [ ] **Step 1:** Create the test file asserting the migration exists and contains:
  - `powerhouse_enrich_outbound_execution_gates_v1`
  - `powerhouse_promote_commercial_learnings_v1`
  - `powerhouse_revenue_acceleration_cycle_v1`
  - all six hard-gate names
  - Gmail `provider_readback_verified`
  - no assumption that LinkedIn is provider-capable
  - `PROVEN`, `WEAKENING`, `REJECTED`
  - call to `powerhouse_commercial_learning_cycle_v1`
  - call to `powerhouse_prepare_safe_actions_v1`
  - `powerhouse-revenue-acceleration-v1` hourly cron at minute 32
  - runtime learning/event writes
  - revoke public/anon/authenticated and grant service_role.
- [ ] **Step 2:** Commit the RED contract test before the migration exists.

### Task 2: Outbound hard-gate enrichment

**Files:**
- Create: `supabase/migrations/20260915143000_powerhouse_revenue_acceleration_mode_v1.sql`

**Interfaces:**
- Produces: `public.powerhouse_enrich_outbound_execution_gates_v1(date) -> jsonb`.

- [ ] **Step 1:** Implement exact destination derivation from `powerhouse_commercial_next_best_action_v2`.
- [ ] **Step 2:** Require a recent Gmail provider-readback event for e-mail provider capability.
- [ ] **Step 3:** Require a verified LinkedIn outbound provider-readback event for LinkedIn DM capability; otherwise false.
- [ ] **Step 4:** Derive contact-pressure from recent executed/prepared external actions to the same `person_key`.
- [ ] **Step 5:** Derive eligibility/identity/truth only from canonical opportunity/person/context evidence.
- [ ] **Step 6:** Persist gate evidence into existing `powerhouse_sales_actions.evidence.execution_gate`; do not change action status here.

### Task 3: Automatic learning promotion/demotion

**Files:**
- Modify: `supabase/migrations/20260915143000_powerhouse_revenue_acceleration_mode_v1.sql`

**Interfaces:**
- Produces: `public.powerhouse_promote_commercial_learnings_v1(date) -> jsonb`.

- [ ] **Step 1:** Update canonical `revenue_learnings` by deterministic sample/confidence/baseline/effect rules.
- [ ] **Step 2:** Apply the same evidence thresholds to `social_learnings`.
- [ ] **Step 3:** Apply compatible promotion/weakening logic to `powerhouse_sales_learnings` without inventing baselines.
- [ ] **Step 4:** Emit `commercial_learning_status_changed` runtime events for status transitions.

### Task 4: Revenue acceleration orchestration and health

**Files:**
- Modify: `supabase/migrations/20260915143000_powerhouse_revenue_acceleration_mode_v1.sql`

**Interfaces:**
- Produces: `public.powerhouse_revenue_acceleration_cycle_v1(date) -> jsonb`.

- [ ] **Step 1:** Run `powerhouse_commercial_learning_cycle_v1`.
- [ ] **Step 2:** Run gate enrichment.
- [ ] **Step 3:** Run `powerhouse_prepare_safe_actions_v1`.
- [ ] **Step 4:** Run learning promotion/demotion.
- [ ] **Step 5:** Read full-cycle proof, flywheel, maturity and sales-strategy performance evidence.
- [ ] **Step 6:** Compute fail-closed health and write `revenue_acceleration_cycle` to `powerhouse_runtime_events` plus `bg_gezondheid`.
- [ ] **Step 7:** Record a permanent production-learning entry documenting the prior zero-gate-materialization bottleneck and prevention.

### Task 5: Scheduling, security and production proof

**Files:**
- Modify: `supabase/migrations/20260915143000_powerhouse_revenue_acceleration_mode_v1.sql`

**Interfaces:**
- Existing pg_cron family; service_role-only SQL execution.

- [ ] **Step 1:** Revoke function execute from `public`, `anon`, `authenticated`; grant to `service_role`.
- [ ] **Step 2:** Create or replace one cron job `powerhouse-revenue-acceleration-v1` at `32 * * * *` using a direct SQL function call; do not create a provider or scheduler family.
- [ ] **Step 3:** Run the contract suite and required GitHub gates.
- [ ] **Step 4:** Merge only the exact green head SHA.
- [ ] **Step 5:** Apply the migration to production Supabase.
- [ ] **Step 6:** Execute `powerhouse_revenue_acceleration_cycle_v1()` once and read back:
  - enriched external actions;
  - prepared e-mail actions versus fail-closed LinkedIn actions;
  - learning status transitions;
  - flywheel/outcome metrics;
  - runtime event evidence;
  - cron schedule;
  - final health.
- [ ] **Step 7:** Do not claim LIVE & BEWEZEN unless production readback confirms the exact merged behavior.