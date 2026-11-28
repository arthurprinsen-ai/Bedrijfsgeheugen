# Heartbeat native decision authority — prevent generic cron overwrite

**Incident:** `powerhouse|heartbeat|native-decision-overwritten-by-generic-cron-receipt|20261105-v1`.

## Observed evidence
After protected PR #5450 and native execution of original cron #171 at 15:31 UTC, the original watchdog had independently written `decision`, `action`, `outcome`, `learning`, and `guard` at exactly `2026-11-05T15:31:00.023207Z`, with `decision_kind=VERIFIED_NO_SOURCE_REPAIR_REQUIRED`, `unhealthy_sources=0`. The existing assurance sync then overwrote `decision` with generic `scheduled_policy_execution` at cron end `15:31:02.419347Z`, erasing the actual native evidence while leaving an incorrectly justified GREEN stage.

## Source repair
Change precisely the generic cron-success promotion condition in original `powerhouse_sync_loop_assurance_receipts_v1`: do not write a generic `decision` for `data-spine-watchdog`, whose exclusive ten-minute source owner is `powerhouse_data_spine_watchdog_v1`. Retain canonical cron input, runtime readback, every other loop's behavior, all schedules, existing privileges, identity constraints, no customer impact fabrication.

## Required end-to-end closure
1. Protected source checks and real Supabase Preview on the NEW candidate migration; never falsify the applied migration lock.
2. Protected main merge, independently read back applied migration and actual function definition.
3. Observe next natural source tick of original #171 and following assurance refresh. `decision.evidence_type` must remain `original_watchdog_same_tick_source_truth`, with source tick equal to `action` and `guard`.
4. Only source-stage assurance may be GREEN; this cannot claim real revenue, public posts, or model calibration.

Regression: `tests/brain-data-spine-decision-source-priority-20261105.test.mjs`.
