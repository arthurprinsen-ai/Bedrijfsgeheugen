# P0 #4198 — Five-minute resilience proof, same scheduler

## Independently observed root cause

The connected production database `adhjwmvyoixzjtmiroln` showed successful pg_cron mux slots at 10:21, 10:23, 10:24, 10:26, 10:28, 10:29, 10:31, 10:33 and 10:34 UTC. The original `powerhouse_runtime_scheduler_mux_v1` schedules the actual resilience watchdog at **minute MOD 5=1** (10:21, 10:26, 10:31, 10:36); the separate regression stage evidence oracle writes the other six stage receipts only at **minute 23/53**. Assurance expects two minutes, and the original 2x freshness check invalidates six stages after four minutes. This is not a missing scheduler or a failed watchdog.

Original mistaken fingerprint `powerhouse|execution-resilience|assurance-cadence-2m-vs-5m|20261025-v1` is RETIRED in the canonical Brain. The corrected fingerprint is `powerhouse|execution-resilience|regression-stage-30m-vs-4m-assurance-window|20261025-v1`.

## Existing-one-owner correction

This candidate updates **only the existing** `powerhouse_execution_resilience_watchdog_v1` (original exact operation-selection, selftest exclusion, bounded recovery, no safe blind replay) to emit the operational action/readback/outcome/measurement/learning/guard receipts with exact invocation time, from the same real watchdog execution. The guard is true only when the original unhandled-stale predicate returns zero after the recovery scheduling pass. Verified no-op is recorded only when no recovery was scheduled. It does **not** claim recovery completion, provider delivery, revenue, or zero historical escalations. The original `powerhouse_runtime_scheduler_mux_v1` and job #171 are unchanged.

The assurance registry's expected cadence becomes **5 minutes**, matching the inner watchdog; the existing two-times freshness rule therefore tolerates 10 minutes, not 4. The 30-minute regression oracle remains an independent source, but is no longer the sole evidence freshness authority. No new cron, queue, send channel, table, RLS grant or suppressed guard.

## Independent test and protected release requirements

- Regression: `node --test tests/brain-p0-4198-resilience-owned-watchdog-proof-20261025.test.mjs`.
- Native Supabase Preview replays the exact source migration and checks the original service permissions and selftest exclusions.
- Required and CodeQL must both succeed on the exact head. Protected merge only; no direct-production DDL.
- Post-deploy readback must show watchdog task on five-minute slots, six same-invocation receipts with `evidence_type=verified_existing_watchdog_execution`, genuine guard passed and all assurance stages fresh after at least two separate production task cycles. Also test a real failed/stale-operation scenario: must not falsely report healthy.
- Existing `brain_reconciliation_jobs` has two historic `ESCALATED` recoveries that remain separately visible, not automatically marked RESOLVED.
- Full 15-loop GREEN and realized euro value remain **UNPROVEN**; this is only a bounded operational repair.

Source of truth: [P0 #4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198).
