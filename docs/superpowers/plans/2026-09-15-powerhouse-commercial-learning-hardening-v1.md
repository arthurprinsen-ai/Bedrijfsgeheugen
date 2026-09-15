# Powerhouse Commercial Learning Hardening v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining commercial learning gaps with causal-test candidates, economic truth, customer expansion, loss/competitor/provider learning, human-feedback learning, explainability and capacity/freshness guards, without creating a parallel CRM or learning store.

**Architecture:** Reuse the existing canonical Powerhouse tables and Revenue Intelligence Loop. Add rebuildable/security-invoker views only; no new transactional store. Sparse or missing evidence stays explicitly unknown/fail-closed. Current pricing and freshness views are reused rather than duplicated.

**Tech Stack:** PostgreSQL/Supabase, GitHub Actions, Node contract tests.

**Spec:** `docs/learning/2026-09-15-powerhouse-commercial-learning-hardening-v1.md`

## Global Constraints

- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- No Make dependency and no parallel CRM, queue, analytics store or learning store.
- Revenue means observed `powerhouse_sales_outcomes.revenue_eur`; forecasts/attribution are labelled separately.
- Counterfactual output is a prospective holdout candidate, never causal proof until an outcome window matures.
- Missing evidence remains `unknown`/`insufficient_evidence`; never synthesize outcomes.
- Browser roles must not receive direct access to internal intelligence views.

---

### Task 1: Contract test

**Files:**
- Create: `tests/revenue-learning-commercial-hardening-v1.test.mjs`
- Create later: `supabase/migrations/20260915183000_powerhouse_commercial_learning_hardening_v1.sql`

**Interfaces:**
- Consumes existing `powerhouse_sales_actions`, `powerhouse_sales_outcomes`, `powerhouse_opportunities`, `powerhouse_forecasts`, `powerhouse_runtime_events`, `powerhouse_offer_pricing_learning_v1`, and `powerhouse_source_freshness_v1`.
- Produces bounded views for counterfactual candidates, unit economics, expansion, loss/competitor intelligence, provider health, human feedback, revenue truth, explainability, and capacity guard.

- [ ] Write the failing contract test asserting the migration and named views exist and enforce security/fail-closed semantics.
- [ ] Run CI and confirm RED before the migration exists.
- [ ] Add the migration.
- [ ] Run CI and confirm GREEN.

### Task 2: Production migration

**Files:**
- Create: `supabase/migrations/20260915183000_powerhouse_commercial_learning_hardening_v1.sql`

- [ ] Create the derived views with `security_invoker=true`.
- [ ] Revoke `anon`/`authenticated`, grant `service_role` only.
- [ ] Apply migration to canonical Supabase project.
- [ ] Read back view counts and health truth.

### Task 3: Documentation and learning writeback

**Files:**
- Create: `docs/learning/2026-09-15-powerhouse-commercial-learning-hardening-v1.md`

- [ ] Document purpose, definitions, truth boundaries, source lineage and prevention rules.
- [ ] Merge only after Required, Revenue Learning, Supabase Security and BRAIN delivery gates are green.
- [ ] Write Verification, Learning, Memory and CurrentState records into the existing canonical Powerhouse ledger after main readback.
