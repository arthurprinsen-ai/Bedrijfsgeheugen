# Powerhouse Commercial Activation v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining production gaps after `powerhouse-commercial-closed-loop-v2`: turn the existing healthy predictive engine and prepared actions into calibrated commercial learning, conservative opportunity economics, experiment decisions, normalized outcomes and one scheduler-owned v3 proof loop without inventing revenue.

**Architecture:** Extend the existing Supabase/Powerhouse lineage only. Reuse `powerhouse_forecasts`, `powerhouse_forecast_calibration`, `powerhouse_opportunities`, `powerhouse_sales_actions`, `powerhouse_sales_outcomes`, `social_experiments`, `powerhouse_offer_pricing_learning_v1`, `powerhouse_commercial_learning_cycle_v1`, `powerhouse_daily_execution_guard` and the existing hourly scheduler. New functions are orchestration/normalization functions; there is no new queue, CRM, scheduler, analytics store or learning database.

**Tech Stack:** PostgreSQL/PLpgSQL on Supabase, pg_cron, Node `node:test` static migration regression tests, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-15-powerhouse-commercial-closed-loop-design.md`

## Global Constraints

- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- No Make dependency.
- Observed realized revenue remains the only revenue truth; modeled values must be explicitly labeled as modeled priors.
- Direct e-mail/LinkedIn outreach remains fail-closed unless exact destination, eligibility, contact-pressure, identity, truth and provider-capability evidence are all verified.
- A recommendation is never execution; provider/live readback is required for completion.
- No second scheduler; retarget the existing `powerhouse-execution-guard-hourly` authority only.
- New internal functions are `service_role` only; no browser-role execution.
- Database changes must be additive/backward-compatible.

---

### Task 1: Regression contract first

**Files:**
- Create: `tests/supabase-powerhouse-commercial-activation-v3.test.mjs`
- Later implementation target: `supabase/migrations/20260915143000_powerhouse_commercial_activation_v3.sql`

**Interfaces:**
- Consumes: the existing v2 closed-loop contract and canonical Powerhouse tables/views.
- Produces: a failing contract that requires the v3 functions and truth boundaries before production SQL exists.

- [ ] **Step 1: Write the failing test**

Require these exact production interfaces:

```js
assert.match(s,/powerhouse_refresh_opportunity_economics_v2/i);
assert.match(s,/powerhouse_reconcile_commercial_outcomes_v2/i);
assert.match(s,/powerhouse_calibrate_due_forecasts_v2/i);
assert.match(s,/powerhouse_decide_mature_experiments_v2/i);
assert.match(s,/powerhouse_commercial_activation_v3/i);
assert.match(s,/powerhouse_offer_pricing_learning_v1/i);
assert.match(s,/modeled_prior/i);
assert.match(s,/predefined|observed|realized revenue/i);
assert.match(s,/provider_readback/i);
assert.match(s,/cron\.alter_job/i);
assert.doesNotMatch(s,/cron\.schedule\s*\(/i);
```

Also assert that the migration revokes execution from `public, anon, authenticated` and grants only `service_role` for each new function.

- [ ] **Step 2: Run test to verify RED**

Run through the repository test workflow on the test-only commit. Expected: the new test fails because `supabase/migrations/20260915143000_powerhouse_commercial_activation_v3.sql` does not exist yet.

- [ ] **Step 3: Commit the RED test**

Commit only the plan + test, open/update PR, and capture the failing Required/test evidence.

---

### Task 2: Conservative opportunity economics

**Files:**
- Create: `supabase/migrations/20260915143000_powerhouse_commercial_activation_v3.sql`
- Test: `tests/supabase-powerhouse-commercial-activation-v3.test.mjs`

**Interfaces:**
- Produces: `public.powerhouse_refresh_opportunity_economics_v2(p_run_date date) returns jsonb`.
- Consumes: `powerhouse_opportunities`, `powerhouse_offer_pricing_learning_v1`, existing buying-window/next-best-action evidence.

- [ ] **Step 1: Implement a modeled-prior economics refresh**

Use only observed pricing evidence. Compute a portfolio prior from `powerhouse_offer_pricing_learning_v1` using observed offer count, observed win rate and observed average won/offer value. Do not change `expected_value_eur`; write only `expected_revenue_value` and `score_components.commercial_economics_v2` with fields `modeled_prior`, `pricing_evidence`, `pricing_sample_size`, `prior_win_rate`, `prior_ticket_eur`, `opportunity_probability`, `opportunity_confidence`, `buying_window_score`, `modeled_expected_revenue_eur`, `truth_boundary`, and `scored_at`.

The modeled value formula must be conservative:

```sql
prior_ticket_eur
* least(1,greatest(0,opportunity_probability))
* least(1,greatest(0,opportunity_confidence))
* least(1,greatest(0,prior_win_rate))
* (0.25 + 0.75 * buying_window_score)
* least(1, ln(1 + pricing_sample_size) / ln(11))
```

If there is no observed pricing evidence, leave modeled value at zero and write `modeled_prior=false`.

- [ ] **Step 2: Keep truth boundaries explicit**

Never update `expected_value_eur`, `powerhouse_sales_outcomes.revenue_eur`, or realized-revenue aggregates from this function.

- [ ] **Step 3: Return proof counts**

Return `opportunities_scored`, `opportunities_with_modeled_value`, pricing sample size and the explicit truth boundary.

---

### Task 3: Outcome reconciliation and action completion proof

**Files:**
- Modify migration: `supabase/migrations/20260915143000_powerhouse_commercial_activation_v3.sql`

**Interfaces:**
- Produces: `public.powerhouse_reconcile_commercial_outcomes_v2(p_run_date date) returns jsonb`.
- Consumes: `powerhouse_sales_actions`, `powerhouse_sales_outcomes`.

- [ ] **Step 1: Link observed outcomes back to actions**

For each sales outcome with a non-null `action_id`, set the corresponding action `outcome_id` if absent. Set action status to `done` only when the outcome evidence contains explicit provider/readback proof (`provider_readback`, `provider_message_id`, `provider_delivery_id`, `live_url`, or `observed_external_event=true`). Without such proof, keep the action in its current fail-closed state and add reconciliation evidence.

- [ ] **Step 2: Normalize outcome classes in evidence**

Do not mutate raw `outcome_type`; add `evidence.normalized_outcome_class` using: `delivered`, `response`, `positive_response`, `meeting`, `qualified_lead`, `offer`, `won_order`, `lost_order`, `realized_revenue`, `no_response`, `failure`, `other`.

- [ ] **Step 3: Preserve revenue truth**

Only existing observed `revenue_eur` values count as realized revenue. Return `observed_outcomes`, `actions_linked`, `actions_completed_with_provider_readback`, and `observed_realized_revenue_eur`.

---

### Task 4: Due forecast calibration and predictive learning

**Files:**
- Modify migration: `supabase/migrations/20260915143000_powerhouse_commercial_activation_v3.sql`

**Interfaces:**
- Produces: `public.powerhouse_calibrate_due_forecasts_v2(p_run_date date) returns jsonb`.
- Consumes: `powerhouse_forecasts`, `powerhouse_forecast_calibration`, `powerhouse_sales_outcomes`, existing Brier function.

- [ ] **Step 1: Calibrate only due, uncalibrated forecasts**

Select forecasts where `expected_by < p_run_date`, status is `active` or `claimed`, and no calibration exists. Commercial forecasts resolve against post-prediction `powerhouse_sales_outcomes`; other forecasts without an observed eligible outcome resolve false only when their horizon has actually elapsed.

- [ ] **Step 2: Write one calibration per forecast**

Write `actual_event_occurred`, `actual_event_at`, `outcome_value`, `brier_component`, `probability_error`, `actual_lead_days`, `revenue_eur`, `attribution_confidence`, and evidence that names the production contract and post-prediction observation window.

- [ ] **Step 3: Close the forecast lifecycle**

Set forecast status to `materialized` if observed true, otherwise `expired`; write outcome evidence. Do not create duplicate calibration rows.

- [ ] **Step 4: Close matching calibration obligations**

For overdue `revenue_learning_obligations` of type `FORECAST_CALIBRATION`, mark them fulfilled/closed using the table's existing allowed status contract only when the referenced/due forecast has actually been calibrated. If the table contract does not expose a safe fulfilled status, leave the row unchanged and report it rather than weakening the constraint.

- [ ] **Step 5: Return calibration quality**

Return counts plus average Brier score for the newly calibrated set and latest calibration timestamp.

---

### Task 5: Experiment decisions without fake winners

**Files:**
- Modify migration: `supabase/migrations/20260915143000_powerhouse_commercial_activation_v3.sql`

**Interfaces:**
- Produces: `public.powerhouse_decide_mature_experiments_v2(p_run_date date) returns jsonb`.
- Consumes: `social_experiments`, `bg_post_kenmerken`, `powerhouse_sales_outcomes`.

- [ ] **Step 1: Decide only experiments whose decision date has arrived and sample minimum is met**

Count observed posts linked through `bg_post_kenmerken.experiment_id` and commercial outcomes linked through their post keys. If sample is below `min_steekproef`, keep `INSUFFICIENT_EVIDENCE`/open and do not fabricate a winner.

- [ ] **Step 2: Produce deterministic decisions**

Use only these decisions:
- `PROMOTE_COMMERCIAL_EVIDENCE` when minimum sample is met and at least one observed commercial outcome or observed revenue exists;
- `HOLD_NO_COMMERCIAL_EVIDENCE` when minimum sample is met but there is no commercial evidence;
- `CONTINUE_MEASURING` when the sample is insufficient.

Write `besluit`, `besloten_op` only for the first two terminal decisions; preserve observed counts and truth boundary in `resultaat.commercial_activation_v3`.

- [ ] **Step 3: Create/update canonical learning evidence**

Upsert one `powerhouse_sales_learnings` record summarizing experiment decisions and explicitly distinguish observed association from experimentally supported lift.

---

### Task 6: One scheduler-owned activation loop

**Files:**
- Modify migration: `supabase/migrations/20260915143000_powerhouse_commercial_activation_v3.sql`

**Interfaces:**
- Produces: `public.powerhouse_commercial_activation_v3(p_run_date date) returns jsonb`.
- Consumes: existing `powerhouse_commercial_closed_loop_v2` plus Tasks 2-5.

- [ ] **Step 1: Orchestrate in the safe order**

Call:
1. `powerhouse_commercial_closed_loop_v2(p_run_date)`;
2. `powerhouse_refresh_opportunity_economics_v2(p_run_date)`;
3. `powerhouse_reconcile_commercial_outcomes_v2(p_run_date)`;
4. `powerhouse_calibrate_due_forecasts_v2(p_run_date)`;
5. `powerhouse_decide_mature_experiments_v2(p_run_date)`;
6. `powerhouse_commercial_closed_loop_v2(p_run_date)` again so final guard/readback consumes the fresh evidence.

- [ ] **Step 2: Write a consolidated production event**

Upsert `powerhouse_runtime_events` under a v3 dedupe key with `state='closed'`, `data_quality='OBSERVED'`, `confidence=1` only when the inner closed loop has `required_sources_bad=0`, predictive health is healthy, execution status is complete, and no function returned an error.

- [ ] **Step 3: Retarget existing cron only**

Use `cron.alter_job` on `powerhouse-execution-guard-hourly` so its command becomes `select public.powerhouse_commercial_activation_v3();`. Do not call `cron.schedule`.

- [ ] **Step 4: Harden execution privileges**

Revoke all on all four helper functions plus the v3 orchestrator from `public, anon, authenticated`; grant execute only to `service_role`.

---

### Task 7: GREEN verification, merge, production and learning writeback

**Files:**
- Test: `tests/supabase-powerhouse-commercial-activation-v3.test.mjs`
- Migration: `supabase/migrations/20260915143000_powerhouse_commercial_activation_v3.sql`

**Interfaces:**
- Produces: tested GitHub candidate, production Supabase migration and canonical learning/writeback evidence.

- [ ] **Step 1: Run the branch test workflow**

Expected: new regression test and Required/backend/security gates green.

- [ ] **Step 2: Merge only the green PR**

Capture exact head SHA and merge SHA.

- [ ] **Step 3: Apply the exact merged migration to Supabase production**

Use the migration contents from the merged commit; no hand-edited drift.

- [ ] **Step 4: Production readback**

Run `powerhouse_commercial_activation_v3()` and verify:
- predictive health true;
- overdue calibrations = 0;
- existing/new due forecasts calibrated where eligible;
- actions remain fail-closed without provider proof, and provider-proven outcomes can complete actions;
- experiment decisions are nonzero only where sample rules permit;
- opportunity modeled economics is nonzero only from observed pricing evidence and remains labeled `modeled_prior`;
- realized revenue remains unchanged unless an observed sales outcome already contains revenue;
- execution status complete;
- required source health bad count = 0.

- [ ] **Step 5: Canonical learning/writeback**

Write/update `brain_failure_registry`, `brain_obligations`, `powerhouse_sales_learnings` and `powerhouse_runtime_events` with root cause, proven fix, evidence, regression reference and prevention rule. Close only obligations whose completion gates are proven in production.

- [ ] **Step 6: Final status**

Report one hard status: `LIVE & BEWEZEN`, `DEELS LIVE`, `GEBLOKKEERD`, or `NIET GEDAAN`, with production readback evidence.