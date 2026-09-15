# Powerhouse Revenue Intelligence Loop v1

Status: canonical production architecture
Date: 2026-09-15

## Purpose

This loop turns the existing Powerhouse commercial core into an account-aware, evidence-driven revenue decision system. It does not replace the existing CRM-like source data, queues, forecasts or learning stores. It derives commercial intelligence from the canonical Powerhouse lineage and writes operational health back into the existing daily run.

## Canonical lineage

`runtime event -> person/company intelligence -> opportunity -> buying window -> forecast -> next-best-action -> observed outcome -> calibration -> learning -> revised next-best-action`

Supabase is transactional source of truth. Notion is a knowledge/audit projection. The Chrome/LinkedIn cockpit is an execution surface, not an independent brain.

## Production surfaces

- `powerhouse_contact_pressure_v1`: outbound/inbound recency, no-response pressure, cooldown and follow-up state.
- `powerhouse_account_strategy_v1`: company-level buying committee, account thesis and coordinated account move.
- `powerhouse_research_queue_v1`: fail-closed research obligations for stale, contradictory or incomplete evidence.
- `powerhouse_commercial_next_best_action_v3`: dynamic wait/research/comment/DM/e-mail/warm-intro decision, verified-asset gate and bounded empirical funnel predictions.
- `powerhouse_revenue_attribution_v1`: exact action lineage is `observed`; weaker opportunity/content linkage is explicitly `correlated`.
- `powerhouse_model_health_v1`: sample size, Brier score, calibration error, false positives/negatives and probability drift.
- `powerhouse_experiment_learning_v2`: experiments cannot become proven from engagement-only evidence; downstream commercial outcomes and minimum sample are required.
- `powerhouse_revenue_command_center_v2`: ranked actions by commercial value with reason, pressure, evidence, predictions and structural-lineage flags.

## API

`powerhouse-revenue-intelligence` is a thin readback/orchestration facade over the canonical views. It uses the same `x-powerhouse-token` device-token contract as `powerhouse-runtime`; it creates no parallel data store or learning system.

Routes:
- GET `/health`
- GET `/command-center`
- GET `/accounts`
- GET `/research`
- GET `/model-health`
- GET `/attribution`
- GET `/experiments`
- POST `/daily`

Scopes reuse existing token scopes (`health`, `actions`, `opportunities`, `learning`, `daily`) so no new privilege family is introduced.

## Fail-closed rules

Outbound is suppressed when identity is incomplete, evidence requires research, or contact pressure is in cooldown. Missing verified assets are treated as no asset. Missing forecast lineage on an outbound recommendation is a structural gap. Prediction confidence declines when empirical sample size is sparse. Correlation is never reported as observed causality. No sales win, reply, meeting or revenue is inferred without an observed outcome record.

## Daily learning and health

The production cron `powerhouse-revenue-intelligence-daily` runs after the existing external-signal, opportunity, prediction and content stages. It writes a `revenue_intelligence_loop` evidence block into the existing `powerhouse_daily_runs` record.

The daily state becomes `degraded` only for structural lineage/writeback failures such as outbound recommendations without forecast lineage, identity conflicts or runtime error events. Ordinary low confidence produces a research obligation rather than a false failure or a guessed action.

## Prediction semantics

The NBA v3 reply/meeting/proposal/win values are deterministic, smoothed empirical estimates from observed action/outcome history adjusted by the current buying-window probability. They are not a trained ML model and are not guarantees. The model identifier is `nba-v3-empirical-smoothed`. Real calibration data must replace broad priors as sample sizes grow.

## Learning contract

Every material system change follows:

`detect -> prioritize -> execute -> test -> production -> readback -> root cause -> regression prevention -> canonical writeback`

Every commercial action follows:

`evidence -> prediction -> action -> observed outcome -> calibration -> learning -> revised decision`

## Browser boundary

The server-side intelligence loop can be LIVE & BEWEZEN independently. Chrome/LinkedIn remains DEELS LIVE until a real browser session proves Chrome -> Supabase writeback with an exact identity and subsequent readback. Server evidence must never be used to claim browser execution that did not occur.
