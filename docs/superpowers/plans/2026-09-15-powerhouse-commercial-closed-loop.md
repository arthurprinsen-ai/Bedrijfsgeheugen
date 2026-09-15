# Powerhouse Commercial Closed Loop — implementation plan

**Design:** `docs/superpowers/specs/2026-09-15-powerhouse-commercial-closed-loop-design.md`
**Branch:** `powerhouse-commercial-closed-loop-20260915`
**Lane:** backend / Supabase

## Current production inventory

Production already contains the main intelligence primitives, including `powerhouse_commercial_learning_cycle_v1`, `powerhouse_refresh_linkedin_sales_intelligence_v1`, `powerhouse_commercial_next_best_action_v2`, `powerhouse_buying_window_v2`, `powerhouse_company_intelligence_v1`, `powerhouse_person_intelligence_v1`, `powerhouse_freshness_contradiction_v1`, `powerhouse_revenue_flywheel_v1`, forecast calibration and the daily execution guard.

The material gap is orchestration and proof: the daily guard does not invoke the commercial-learning and LinkedIn-sales-intelligence cycles, the source-level freshness contract is not part of the daily completion decision, and safe internal/review actions are not explicitly promoted while direct outreach must remain fail-closed until exact destination/eligibility evidence exists.

## Task 1 — regression contract first

Create `tests/supabase-powerhouse-commercial-closed-loop.test.mjs` before the migration. It must require:
- `powerhouse_source_freshness_v1`;
- `powerhouse_prepare_safe_actions_v1`;
- `powerhouse_commercial_closed_loop_v2`;
- orchestration of existing LinkedIn intelligence + commercial learning + daily execution components;
- no auto-promotion of `linkedin_dm`/`email` without explicit eligibility evidence;
- source freshness embedded in daily evidence;
- observed-revenue truth boundary;
- service-role-only security for any new internal view.

Expected RED before the migration exists.

## Task 2 — source freshness contract

Add one internal `security_invoker` view over existing canonical evidence tables/health logs. It exposes source, latest evidence timestamp, expected cadence, lag, and status. Browser roles are revoked; service_role retains SELECT.

No new ingestion store is introduced.

## Task 3 — safe action preparation

Add `powerhouse_prepare_safe_actions_v1(p_run_date)`:
- only changes action state when the existing evidence proves the execution class is safe;
- automatically prepares internal research/enrichment/review work;
- direct `email`, `linkedin_dm`, or equivalent outreach remains `suggested` unless exact-destination, eligibility, contact-pressure, identity, truth and provider-capability proof is present in canonical evidence;
- never marks external actions executed or completed;
- writes counts and fail-closed reason to runtime/health evidence.

## Task 4 — closed-loop orchestrator

Add `powerhouse_commercial_closed_loop_v2(p_run_date)` that runs, in order:
1. existing LinkedIn sales intelligence refresh;
2. existing commercial learning cycle;
3. safe action preparation;
4. source freshness readback;
5. existing daily execution guard;
6. consolidated commercial maturity/control-room evidence;
7. material outcome writeback to existing `powerhouse_sales_learnings`, `powerhouse_runtime_events`, `bg_gezondheid`, and `powerhouse_daily_runs.evidence`.

The orchestrator must not promote business maturity to green when revenue/outcome evidence is insufficient.

## Task 5 — scheduler integration

Keep the existing hourly cron authority and replace only its command target from the legacy daily guard to `powerhouse_commercial_closed_loop_v2()`. No second scheduler.

## Task 6 — verification

Verify in production:
- new functions/view exist and browser roles cannot read internal view;
- cron is still one active job and invokes the v2 closed loop;
- a real run produces LinkedIn intelligence, commercial learning, action-preparation, freshness and daily guard evidence;
- direct outbound remains fail-closed without proof;
- safe internal actions can become prepared;
- forecasts/opportunities/NBA remain populated;
- realized revenue remains based only on observed outcomes;
- security advisor has no new unsafe-view finding.

## Task 7 — canonical repository + delivery

Commit migration + regression test + design/plan, open PR to main, run Required/backend gates, merge only when green. No Netlify deploy is needed unless website files change. After merge, read back main SHA and production database state.

## Task 8 — learning/writeback

Write the prior root cause and prevention rule into the existing canonical learning lineage:

**Root cause:** intelligence capabilities existed independently but the daily scheduler authority invoked only the legacy execution guard, so commercial-intelligence/learning/freshness preparation could be present without being a mandatory part of each run.

**Prevention:** every mandatory commercial capability must be reachable from one scheduler-owned closed-loop orchestrator and its production readback must be embedded in the daily-run evidence; direct outbound remains fail-closed without destination/eligibility/provider proof.
