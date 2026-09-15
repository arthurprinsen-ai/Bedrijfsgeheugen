# Powerhouse LinkedIn Sales Intelligence v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the existing Powerhouse commercial loop with person/company intelligence, calibrated buying-window prediction, contextual multichannel next-best-actions, evidence selection and closed-loop strategy learning.

**Architecture:** Extend the existing canonical Supabase lineage only: `bg_connecties` + `powerhouse_runtime_events` + `powerhouse_predictive_signals` + `powerhouse_opportunities` + `powerhouse_sales_actions` + `powerhouse_sales_outcomes` + `powerhouse_forecasts` + `powerhouse_forecast_calibration` + `powerhouse_sales_learnings`. Add derived views and one least-privilege refresh function; do not create a parallel CRM, graph store, queue, scheduler or learning store. Reuse the existing daily scheduler window and dedupe keys.

**Tech Stack:** PostgreSQL/Supabase, pg_cron, Node test runner, existing Powerhouse runtime tables.

**Spec:** User-approved Powerhouse commercial intelligence requirements from 2026-09-15.

## Global Constraints

- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- Supabase is the transactional runtime truth; Notion is knowledge/audit projection.
- No Make dependency and no parallel CRM, brain, queue, analytics or learning system.
- Human/provider eligibility, exact-destination, consent, contact-pressure, identity, truth, dedupe and readback gates remain authoritative.
- New internal views/functions must follow the Supabase security contract: `security_invoker`, no anon/authenticated access, deterministic `search_path`, service-role only for internal SECURITY DEFINER functions.
- Predictions remain probabilistic and must be calibrated against observed outcomes.
- Realized revenue is counted only from observed outcomes.

---

### Task 1: Regression contract

**Files:**
- Create: `tests/supabase-powerhouse-linkedin-sales-intelligence.test.mjs`

**Interfaces:**
- Consumes: repository migration files and canonical Powerhouse policies.
- Produces: required assertions for person/company intelligence, buying-window prediction, next-best-action, evidence selection, calibration, security and no-parallel-store invariants.

- [ ] Write the failing regression test.
- [ ] Run Required test and confirm RED because the migration does not yet exist.
- [ ] Keep the test as a permanent release gate.

### Task 2: Canonical commercial intelligence layer

**Files:**
- Create: `supabase/migrations/20260915124500_powerhouse_linkedin_sales_intelligence_v1.sql`

**Interfaces:**
- Produces views `powerhouse_person_intelligence_v1`, `powerhouse_company_intelligence_v1`, `powerhouse_buying_window_v2`, `powerhouse_commercial_next_best_action_v2`, `powerhouse_sales_strategy_performance_v1`.
- Produces function `powerhouse_refresh_linkedin_sales_intelligence_v1(date)`.

- [ ] Derive one current person state from existing connection/events/actions/outcomes.
- [ ] Derive company state by combining people, opportunities, predictive/external signals and outcomes.
- [ ] Calculate evidence-backed buying windows and confidence.
- [ ] Select the best channel, message strategy, smallest relevant evidence asset and CTA.
- [ ] Upsert at most twenty daily actions using the existing `autonomy:<date>:<opportunity>` dedupe lineage.
- [ ] Persist pre-action commercial forecasts in `powerhouse_forecasts`.
- [ ] Calibrate matured commercial forecasts from observed Powerhouse sales outcomes.
- [ ] Write aggregate strategy performance back through `powerhouse_sales_learnings`.
- [ ] Add a daily pg_cron refresh after the predictive engine and before content orchestration.
- [ ] Apply least-privilege grants and search-path hardening.

### Task 3: Production verification and canonical writeback

**Files:**
- Update existing Powerhouse knowledge/current-state records only; no new truth store.

**Interfaces:**
- Consumes: production Supabase objects, GitHub protected main, Netlify production deploy, Notion canonical registers.
- Produces: exact production readback and learning evidence.

- [ ] Run the refresh function in production and inspect person/company/NBA/prediction counts.
- [ ] Verify the cron exists and is active.
- [ ] Open PR, require protected `test` green, merge only from current main.
- [ ] Verify Netlify production resolves the exact merged SHA.
- [ ] Verify Supabase objects and latest health/learning rows after merge.
- [ ] Append the change and evidence to the existing Powerhouse current-state/learning documentation.
