# Original #171 Infinity source failure isolation (P0 #4198)

## Reproduced root cause
On 2026-11-16 at 06:41 UTC (07:41 Europe/Amsterdam), the existing original Supabase cron #171 failed with `POWERHOUSE_INFINITY_CURRENT_SIGNAL_REQUIRED`. The currently deployed `powerhouse_runtime_scheduler_mux_v3(timestamptz)` invokes `powerhouse_infinity_operating_loop_v1` without local exception handling at local 07:41. An uncaught PL/pgSQL exception aborts the transaction, potentially rolling back other original mux updates performed before the Infinity substep. The missing current external intelligence source is genuine; no synthetic source is acceptable.

## Minimal same-owner fix
Add a migration replacing only existing v3 function; no new cron, scheduler, agent, table, queue, publisher or provider call. Within the existing 07:41 branch, catch only default SQL `raise_exception` whose exact message is `POWERHOUSE_INFINITY_CURRENT_SIGNAL_REQUIRED`. All other exceptions rethrow. On recognized missing signal, return `SOURCE_EVIDENCE_DUE`, record a failed `powerhouse-infinity-current-signal` task in the original mux task list, set parent `healthy=false` explicitly, and allow previously completed v2 source/Heartbeat tasks to commit. Original #171 records `TASK_FAILURE` with task receipt; it never claims Infinity result or learning.

## Safety, verification, rollback
Keep original 07:41 Europe/Amsterdam trigger and :54 universe refresh, existing `SECURITY DEFINER` + service-role-only function ACL, and no provider-side effect replay. Regressions: `tests/brain-infinity-original-mux-source-isolation-20261116.test.mjs` (historical replay, exception identity, false-green guard, original scheduler). Required + BRAIN + CodeQL + native Supabase Preview on exact PR head are mandatory; then protected merge, native production function readback and next natural #171 receipts. Absence of a valid current external signal continues to block Infinity business proof; it does not block unrelated safe original work.

Outcome status until those checks: **CANDIDATE_NOT_LIVE**. Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
