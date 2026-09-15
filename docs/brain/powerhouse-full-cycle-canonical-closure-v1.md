# Powerhouse full-cycle canonical closure v1

Status authority: production evidence, never prose.

This contract closes the already-live Bedrijfsgeheugen Powerhouse into one canonical commercial loop. It extends `growth-revenue-os-1m-2027-v1`; it does not create a second brain, CRM, queue, calendar, analytics store, learning store or scheduler.

## Permanent invariants

- **EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.**
- **NO PARALLEL TRUTH.** Supabase/Powerhouse remains canonical; GitHub is the source-controlled implementation; provider/public readback proves external effects.
- Make is retired from the active production loop.
- Forecasts are forecasts; observed facts and REALIZED REVENUE are the reward truth.
- Missing, stale or contradictory evidence fails closed.
- Every production change writes evidence, outcome and learning back into existing Powerhouse lineage.

## One commercial cycle

`signals -> source health/freshness -> opportunity discovery -> forecast -> next-best-action -> channel decision -> artifact/action -> provider/public readback -> outcome -> attribution -> realized revenue -> calibration -> strategy/offer/experiment learning -> next decision`

The operational authority is the existing `powerhouse_full_cycle_production_proof(day)`. It composes the existing `powerhouse_execution_status`, revenue autonomy, growth NBA, relationship graph, outcome obligations, attribution, experiments, commercial learning and source-health evidence. `HEALTHY` is valid only when execution, pipeline and learning are all green.

`powerhouse_autonomous_gap_closer(day)` is the recovery loop. It may invoke the existing revenue outcome sweep, `powerhouse_growth_nba`, autonomous growth cycle, LinkedIn sales intelligence, outcome sweeper and `powerhouse_commercial_learning_loop(day)`, then re-run full-cycle proof. It may not invent synthetic outcomes to make health green.

`powerhouse_commercial_learning_loop(day)` owns observed outcome processing, forecast calibration, sales-strategy learning, experiment decisioning, strategy evolution and offer discovery. Real observations accumulate over time; volume is never fabricated.

`powerhouse_daily_executive_cockpit(day)` is the executive projection. It must remain a view/projection of canonical stores, not a competing workflow or datastore.

`powerhouse_project_brain_revenue_learning` preserves prediction -> action -> outcome -> calibration lineage in the existing `powerhouse_forecasts`, `powerhouse_sales_actions`, `powerhouse_sales_outcomes` and `powerhouse_forecast_calibration` stores.

## Channel execution

The daily content orchestrator must persist exactly seven Brain decisions for the canonical content lanes. A decision may be publish, skip or hold only when the current capability/evidence gates support that state. Unsupported delivery is an explicit HOLD, never a fabricated success. Personal LinkedIn remains hard fail-closed on `arthur-personal-linkedin-identity-v4` and `channel-identity-hard-gate-v3`.

The social publisher must verify identity/content gates before provider mutation and must perform provider readback after mutation. A readback mismatch is contained and recorded rather than reported as success.

## Commercial learning

The north-star reward is realized revenue with attributable evidence. Intermediate metrics (reach, clicks, engagement, replies, meetings, proposals) are explanatory signals, not substitutes for revenue. Champion/challenger experiments may explore hooks, problem stage, format, CTA, timing, channel mix and offer framing, but promotion requires observed evidence.

Relationship intelligence, buying-window signals, cross-channel attribution, opportunity discovery, offer learning and forecast calibration all reuse the existing graph, signal, forecast, action, outcome, experiment and runtime ledgers.

## Production definition of done

A change is only `LIVE & BEWEZEN` when the exact source-controlled revision has passed protected GitHub checks, the relevant production database/function source is read back, `powerhouse_full_cycle_production_proof(current_day)` is `HEALTHY`, and canonical Powerhouse runtime/delivery/production-truth evidence records the exact revision and production observations. Anything less is `DEELS LIVE`, `GEBLOKKEERD` or `NIET GEDAAN`.
