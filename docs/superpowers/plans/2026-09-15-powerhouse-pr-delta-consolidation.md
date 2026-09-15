# Powerhouse PR delta consolidation — canonical implementation spec

Date: 2026-09-15
Status: canonical delta implementation spec
Parent system: Bedrijfsgeheugen Growth & Revenue Operating System / Powerhouse

## Decision

Consolidate only still-valid deltas from PRs #1503, #1506 and #1543 against current production/current `main`. Do not merge stale branches one-by-one and do not rebuild or downgrade already-existing capabilities.

This is EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP. It extends the existing Powerhouse and introduces no parallel Brain, database, calendar, queue, CRM, analytics store, prediction store, learning store or Make transport.

## Current-state findings

- #1503 still contains a valid seven-channel closed-loop delta. Production has a seven-lane orchestrator decision model, but the publication ledger/watchdogs and social publisher are still on the older execution contract; Instagram is not yet executable through the production publisher.
- #1506 is superseded by stronger production migrations already applied after the old PR was created. Production currently has `powerhouse_project_brain_revenue_learning()` with prediction/settlement projection into `powerhouse_forecasts`, `powerhouse_sales_actions`, `powerhouse_sales_outcomes` and `powerhouse_forecast_calibration`, plus identity validation, bounded numeric values and idempotent calibration protection. Replaying #1506 would be a regression and is therefore forbidden.
- #1543 is superseded: the revenue-flywheel policy and migrations already exist in newer current state. No code from #1543 is replayed.

## Canonical seven lanes

1. `email_newsletter`
2. `linkedin_personal`
3. `linkedin_company`
4. `linkedin_article_personal`
5. `linkedin_article_company`
6. `instagram_company`
7. `blog`

Hard daily publication lanes are `linkedin_personal`, `linkedin_company` and `instagram_company`. Adaptive lanes receive an explicit Brain decision but may HOLD/SKIP only with persisted reason/evidence according to existing policy.

## Still-valid implementation delta — #1503

- normalize legacy publication-ledger channel `instagram` to `instagram_company`;
- project the canonical seven lanes into the existing publication/execution model without new truth stores;
- join Brain decision state and publication execution in the existing content cockpit;
- prevent `SKIPPED` from satisfying hard-social publication obligations;
- source-control the deployed orchestrator and publisher as release sources;
- keep exactly seven decisions per run;
- make hard-social missing prerequisites explicit BLOCKED/recovery evidence, never silent success;
- Instagram may publish only through the existing channel identity plus explicit Mira/media verification and real provider readback;
- preserve real root exceptions when orchestration fails.

## Superseded deltas

### #1506 — revenue calibration persistence

No replay. Production readback is authoritative and demonstrably stronger than the old PR. Its trigger/function remains the canonical revenue prediction → action → outcome → calibration projection and must not be downgraded by this consolidation. Production migration history contains later revenue-calibration/intelligence migrations, including `powerhouse_revenue_calibration_projection_v1`, and live function readback proves the stronger implementation.

### #1543 — revenue flywheel

No replay. Current state already contains the newer flywheel policy/migrations.

After consolidated production readback, close #1503 as superseded by #1587 and close #1506/#1543 as superseded by stronger current production/current-main state.

## Release gates

No completion claim without all applicable proof:

1. focused regression contract for the still-missing seven-channel delta is green after implementation;
2. required GitHub `test` check is green on the exact consolidation PR head;
3. merge is present on current `main`;
4. only the still-valid seven-channel Supabase delta is applied/read back in production;
5. deployed Edge Function versions/readback match consolidated source;
6. seven Brain channel decisions are present for the production daily run;
7. hard-social lanes cannot resolve to silent `SKIPPED` success;
8. Instagram cannot report success without explicit Mira/media verification and a real delivery reference;
9. the already-live revenue prediction → action → outcome → calibration closure remains intact after deployment;
10. consolidation decision and production evidence are written back into canonical Powerhouse learning lineage.

## Failure semantics

Any missing provider/media prerequisite, migration error, test failure, CI failure, deployment failure or production readback mismatch keeps the final status `DEELS LIVE` or `GEBLOKKEERD`. It must not be represented as `LIVE & BEWEZEN`.
