# Powerhouse PR delta consolidation — canonical implementation spec

Date: 2026-09-15
Status: canonical delta implementation spec
Parent system: Bedrijfsgeheugen Growth & Revenue Operating System / Powerhouse

## Decision

Consolidate only still-valid deltas from PRs #1503, #1506 and #1543 against current `main`. Do not merge the stale branches one-by-one and do not rebuild already-existing capabilities.

This is an EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP change. It extends the existing Powerhouse; it does not introduce a parallel brain, database, calendar, queue, CRM, analytics store, prediction store, learning store or Make transport.

## Current-state findings

- #1503 contains a valid seven-channel closed-loop delta, but its branch is stale. Production already has a seven-lane orchestrator decision model, while the publication ledger and social publisher are not yet fully aligned. The live orchestrator still treats Instagram as non-executable and the live publisher only handles LinkedIn.
- #1506 contains a valid persistence-closure delta that projects canonical Brain revenue prediction/settlement learnings into the existing `powerhouse_forecasts`, `powerhouse_sales_actions`, `powerhouse_sales_outcomes` and `powerhouse_forecast_calibration` tables.
- #1543 is superseded on current `main`: the revenue-flywheel policy exists there in a newer form and both flywheel migrations are already present. No code from #1543 is to be replayed.

## Canonical seven lanes

1. `email_newsletter`
2. `linkedin_personal`
3. `linkedin_company`
4. `linkedin_article_personal`
5. `linkedin_article_company`
6. `instagram_company`
7. `blog`

Hard daily publication lanes are `linkedin_personal`, `linkedin_company` and `instagram_company`. Adaptive lanes receive an explicit Brain decision but may legitimately HOLD/SKIP only with persisted reason/evidence according to the existing policy.

## Implementation delta

### A. Seven-channel execution closure (#1503)

- normalize legacy publication-ledger channel `instagram` to `instagram_company`;
- project the canonical seven lanes into the existing publication/execution model without creating new truth stores;
- join Brain decision state and publication execution in the existing content cockpit;
- prevent `SKIPPED` from satisfying hard-social publication obligations;
- source-control the currently deployed orchestrator and publisher as the release source;
- keep exactly seven decisions per run;
- make hard-social missing prerequisites explicit BLOCKED/recovery evidence, never silent success;
- Instagram may only publish through the existing channel identity plus Mira/media gate and must require real provider delivery readback before success;
- preserve the real root exception when orchestration fails.

### B. Revenue calibration persistence closure (#1506)

- reuse the existing four Powerhouse revenue/calibration tables;
- project canonical Brain `revenue_prediction` and `revenue_settlement` Learning records idempotently;
- preserve `decision_id`, `originatingPredictionId`, evidence IDs, Brier/probability error and realized revenue linkage;
- keep no-Make production transport and the existing channel-identity guard coupled to the same Powerhouse lineage.

### C. Superseded flywheel branch (#1543)

No replay. After the consolidated change is merged and read back, close #1543 as superseded by current main, and close #1503/#1506 as superseded by the consolidated implementation.

## Release gates

No completion claim without all applicable proof:

1. focused regression tests fail before implementation for the missing deltas;
2. focused tests pass after implementation;
3. required GitHub `test` check is green on the exact consolidation PR head;
4. merge is present on current `main`;
5. Supabase migrations are applied/read back in production;
6. deployed Edge Function versions/readback match the consolidated source;
7. seven Brain channel decisions are present for the production daily run;
8. hard-social lanes cannot resolve to silent `SKIPPED` success;
9. Instagram cannot report success without canonical Mira/media prerequisites and a real delivery reference;
10. revenue prediction → action → outcome → calibration persistence is verifiably connected;
11. the consolidation decision and production evidence are written back into the canonical Powerhouse learning lineage.

## Failure semantics

Any missing provider/media prerequisite, migration error, test failure, CI failure, deployment failure or production readback mismatch keeps the final status `DEELS LIVE` or `GEBLOKKEERD`. It must not be represented as `LIVE & BEWEZEN`.
