# Powerhouse Revenue Intelligence Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the existing Powerhouse commercial stack into one measurable, fail-closed person/account intelligence, next-best-action, attribution, experimentation, model-monitoring and revenue command loop.

**Architecture:** Extend existing canonical Supabase views/tables and the existing `powerhouse-runtime`; do not create a second CRM, queue, brain or learning store. New SQL surfaces are derived views/functions over current lineage; runtime routes expose them using existing device-token scopes. Existing external-signal, predictive-engine, forecast-calibrator, content-artifact and sales-learning components remain authoritative inputs.

**Tech Stack:** PostgreSQL/Supabase, Supabase Edge Functions (Deno/TypeScript), pg_cron/pg_net, Node contract tests, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-15-powerhouse-revenue-intelligence-loop-design.md`

## Global Constraints

- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- Supabase is transactional source of truth; Notion is a projection.
- Canonical lineage remains `powerhouse_runtime_events -> powerhouse_opportunities -> powerhouse_sales_actions -> powerhouse_sales_outcomes -> powerhouse_forecasts/powerhouse_forecast_calibration -> powerhouse_sales_learnings`.
- No Make dependency and no client-side service-role secret.
- No fabricated outcomes, intent, revenue, cases, opens or clicks.
- Predictions are probabilities and must preserve confidence/evidence.
- Browser-specific work is not `LIVE & BEWEZEN` without real Chrome -> Supabase readback.

---

### Task 1: Complete person/account intelligence and contact pressure

**Files:**
- Create: `supabase/migrations/20260915163000_powerhouse_revenue_intelligence_loop_v1.sql`
- Create: `tests/powerhouse-revenue-intelligence-loop-contract.test.mjs`

**Interfaces:**
- Consumes: `powerhouse_person_intelligence_v1`, `powerhouse_company_intelligence_v1`, `powerhouse_buying_window_v2`, `powerhouse_buying_committee_v1`, `powerhouse_sales_actions`, `powerhouse_sales_outcomes`, `powerhouse_freshness_contradiction_v1`.
- Produces: `powerhouse_contact_pressure_v1`, `powerhouse_account_strategy_v1`, `powerhouse_research_queue_v1`.

- [ ] **Step 1: Write failing contract assertions** for all three new views and required columns (`cooldown_until`, `pressure_state`, `account_thesis`, `recommended_account_move`, `research_reason`, `missing_evidence`).
- [ ] **Step 2: Verify RED** by checking production catalog before migration; all three views must be absent.
- [ ] **Step 3: Implement derived views**. `powerhouse_contact_pressure_v1` derives outbound/inbound recency, no-response history and cooldown; `powerhouse_account_strategy_v1` aggregates committee/person/company/buying-window evidence; `powerhouse_research_queue_v1` selects stale, contradictory, low-confidence or identity-incomplete high-value opportunities.
- [ ] **Step 4: Verify GREEN** with catalog/column checks plus bounded values and no duplicate opportunity/person rows.

### Task 2: Multichannel NBA, evidence gating and command center

**Files:**
- Modify: `supabase/migrations/20260915163000_powerhouse_revenue_intelligence_loop_v1.sql`
- Modify: `supabase/functions/powerhouse-runtime/index.ts`
- Modify: `tests/powerhouse-revenue-intelligence-loop-contract.test.mjs`

**Interfaces:**
- Consumes: Task 1 views plus `powerhouse_commercial_next_best_action_v2`, `powerhouse_content_artifacts`, `powerhouse_action_value_rank_v1`.
- Produces: `powerhouse_commercial_next_best_action_v3`, `powerhouse_revenue_command_center_v2`; runtime routes `/command-center`, `/accounts`, `/research`.

- [ ] **Step 1: Add failing tests** requiring cooldown to force `wait`, insufficient evidence to force `research`, missing verified asset to remove attachment, and command-center ranking by expected commercial value.
- [ ] **Step 2: Verify RED** against current v2 runtime/schema.
- [ ] **Step 3: Implement v3 NBA and command-center views** with `recommended_action`, `recommended_channel`, `next_follow_up_at`, `pressure_state`, `asset_ready`, account strategy and auditable rationale.
- [ ] **Step 4: Extend `powerhouse-runtime`** with GET routes mapped to existing scopes: command-center -> `actions`, accounts -> `opportunities`, research -> `learning`.
- [ ] **Step 5: Verify GREEN** with SQL contracts and runtime source tests.

### Task 3: Attribution, experimentation and model monitoring

**Files:**
- Modify: `supabase/migrations/20260915163000_powerhouse_revenue_intelligence_loop_v1.sql`
- Modify: `supabase/functions/powerhouse-runtime/index.ts`
- Modify: `tests/powerhouse-revenue-intelligence-loop-contract.test.mjs`

**Interfaces:**
- Consumes: `powerhouse_sales_actions`, `powerhouse_sales_outcomes`, `powerhouse_forecasts`, `powerhouse_forecast_calibration`, `social_experiments`, `powerhouse_sales_strategy_performance_v1`.
- Produces: `powerhouse_revenue_attribution_v1`, `powerhouse_model_health_v1`, `powerhouse_experiment_learning_v2`; runtime GET `/model-health` and expanded `/learning` readback.

- [ ] **Step 1: Add failing tests** for observed-vs-correlated attribution labels, Brier score, calibration error, false-positive/false-negative counts, sample-size and drift fields, and experiment promotion thresholds.
- [ ] **Step 2: Verify RED** because the new views do not exist.
- [ ] **Step 3: Implement attribution view** using exact action/outcome lineage as `observed` and weaker content/opportunity linkage as `correlated`, never fabricated causality.
- [ ] **Step 4: Implement model-health view** grouped by predicted event/scope with Brier, calibration gap, false positives/negatives, sample size and recent-vs-prior drift; sparse samples are flagged `insufficient_evidence`.
- [ ] **Step 5: Implement experiment-learning view** so `proven` requires downstream commercial outcomes, minimum sample and confidence; engagement-only evidence cannot prove revenue learning.
- [ ] **Step 6: Verify GREEN** via SQL contracts and runtime route source tests.

### Task 4: Daily autonomous loop, production readback and learning writeback

**Files:**
- Modify: `supabase/functions/powerhouse-runtime/index.ts`
- Modify: `tests/powerhouse-revenue-intelligence-loop-contract.test.mjs`
- Create: `docs/powerhouse/POWERHOUSE_REVENUE_INTELLIGENCE_LOOP_V1.md`

**Interfaces:**
- Consumes: all prior task surfaces and existing scheduled external signals/predictive/calibration jobs.
- Produces: expanded `/daily` evidence with account/NBA/research/model-health/lineage-gap counts and explicit `completed|degraded`; release and prevention learnings in canonical Powerhouse tables.

- [ ] **Step 1: Add failing test** requiring daily health fields and fail-closed degraded status when an outbound NBA lacks forecast/readback lineage.
- [ ] **Step 2: Verify RED** against current runtime source.
- [ ] **Step 3: Extend daily run** to read v3 NBA, research queue and model health, materialize deduped internal-research actions where appropriate, and mark daily `degraded` only for structural lineage/writeback failures rather than ordinary low confidence.
- [ ] **Step 4: Add canonical documentation** describing data flow, scopes, fail-closed rules and operational readback.
- [ ] **Step 5: Run complete tests** and open PR against current `main`.
- [ ] **Step 6: Apply production migration and deploy `powerhouse-runtime`; then read back views, routes, cron compatibility and deterministic non-revenue test lineage.
- [ ] **Step 7: Write canonical release event and regression learnings** to `powerhouse_runtime_events` and `powerhouse_sales_learnings`; never insert a fake commercial win/revenue outcome.
- [ ] **Step 8: Merge only after required GitHub checks are green; re-read merged `main` SHA and production state.
