# Powerhouse Execution & Learning Closure v1 Implementation Plan

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

## Tasks
- Add regression contract for lock, experiment activation, modeled economics, calibrator trigger, scheduler, learning and truth boundary.
- Add `public.powerhouse_execution_learning_closure_v1(date)` using only canonical tables/functions.
- Activate experiments only from published-post evidence and decide only from sufficient observed measurement.
- Close outcome readback obligations only from observed `powerhouse_sales_outcomes`.
- Fill explicitly modeled `expected_revenue_value` from observed pricing priors plus forecast/opportunity confidence while preserving `expected_value_eur`.
- Trigger the existing forecast calibrator only for matured uncalibrated forecasts.
- Serialize the scheduler-owned path and replace the previous direct :47 closed-loop owner.
- Write canonical runtime and learning evidence every run.
- Advance Powerhouse policy to v1.4 and record truth/prevention boundaries.
- Require exact-head CI green, merge, apply production migration, run production readback and persist incidents/learnings.