# Powerhouse Execution & Learning Closure v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining experiment, calibration, modeled-economics and runtime-concurrency gaps in the canonical Powerhouse loop.

**Architecture:** Add one SQL migration that extends the existing canonical lineage with an evidence-driven execution/learning closure function and scheduler. Keep existing experiment/calibrator/revenue engines authoritative; the closure only activates evidence-backed experiments, requests calibration when actually due, enriches modeled economics without touching declared/revenue truth, serializes concurrent runs, and writes readback/learning.

**Tech Stack:** PostgreSQL/PLpgSQL, pg_cron, pg_net, Supabase, Node test contracts, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-15-powerhouse-execution-learning-closure-v1-design.md`

## Global Constraints
- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- No parallel CRM, experiment, analytics, pricing, revenue or learning store.
- No fabricated response, conversion, winner, economic value or realized revenue.
- `expected_value_eur` remains declared/observed truth; modeled economics live in `expected_revenue_value` and labeled score/evidence fields.
- Runtime writes must be concurrency-safe and fail closed.

---

### Task 1: Contract test
**Files:**
- Create: `tests/supabase-execution-learning-closure-v1.test.mjs`

**Interfaces:**
- Consumes migration/policy source text.
- Produces regression coverage for lock, experiment activation, modeled economics, calibrator trigger, scheduler, learning and truth boundary.

- [ ] Write failing source-contract assertions before migration exists.
- [ ] Confirm test fails on missing migration/policy v1.4 markers.

### Task 2: Canonical closure migration
**Files:**
- Create: `supabase/migrations/20260915162000_powerhouse_execution_learning_closure_v1.sql`

**Interfaces:**
- Produces `public.powerhouse_execution_learning_closure_v1(date)` returning JSONB.
- Reuses canonical tables/functions only.

- [ ] Add transaction advisory lock; concurrent run returns explicit `concurrent_skip` evidence.
- [ ] Promote PLANNED experiments to ACTIVE only when a linked `social_posts.published_at` is observed via `bg_post_kenmerken`.
- [ ] Evaluate experiments from real `social_metric_snapshots` and `powerhouse_sales_outcomes`; decide only when minimum sample and decision horizon are satisfied.
- [ ] Enrich `expected_revenue_value` from matching active forecast modeled value, preserving `expected_value_eur`.
- [ ] Detect matured uncalibrated forecasts and call existing `powerhouse-forecast-calibrator` via pg_net only when due.
- [ ] Call existing commercial closed loop after closure mutations.
- [ ] Write runtime event + sales learning with observed counts and truth boundaries.
- [ ] Schedule hourly at minute 32 after existing commercial learning.
- [ ] Revoke browser execution and grant service role only.

### Task 3: Policy integration
**Files:**
- Modify: `brain/policies/powerhouse-revenue-flywheel-v1.json`

**Interfaces:**
- Adds capability `execution_learning_closure`, contract/function/schedule and prevention rules.

- [ ] Advance policy to v1.4.
- [ ] Add reuse map for social metrics/posts and closure function.
- [ ] Add closure contract and mandatory truth boundary.

### Task 4: Verification and production
- [ ] Open PR from isolated branch.
- [ ] Require exact-head Required/BRAIN/Security/brand gates green.
- [ ] Merge exact head.
- [ ] Apply production migration from merged SHA.
- [ ] Run closure manually once and read back scheduler, runtime event, learning, experiment statuses, calibration counts, opportunity modeled values and commercial control room.
- [ ] Record any incident/root cause/prevention as a canonical learning before final status.