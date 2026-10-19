# Canonical runtime scheduler — unreachable cron slots (2026-10-19)

Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4478

Production evidence: job 171 `powerhouse-runtime-scheduler-mux-v1` fired at 01/06/11/16/21/26/31/36/41/46/51/56 only; the v1/v2 functions also define valid work at minute residues 3 and 4 which were mathematically unreachable. The daily prediction-learning audit at 06:04Z was missed. Manual audit evidence on 19 October: 7,041 forecasts, 385 due, 247 unresolved; no fabricated score improvement.

This **single existing canonical scheduler** continues using the same job name/command/advisory lock/runtime evidence table, now includes minute residues 1,3,4. Baseline watchdog/reconciliation remain conditional on residue 1 (12/h unchanged). Exact-minute tasks and source dispatch are unchanged, with no shadow job and no bypass of the 30s statement timeout. The previous 12 slots are all preserved.

Rollout gate: verify native Node reachability tests, Required CI + CodeQL, protected merge, apply migration from main only, read back the exact cron schedule and public function, observe one actual slot-3 and slot-4 `runtime_scheduler_run_evidence_v1` run with canonical `COMPLETED` / honest task failure, and prove the next daily `prediction-learning-audit` event was recorded. Keep failing tasks open rather than labeling the scheduler healthy from a cron row alone. If an added slot exceeds timeout, rebalance within the **same mux**, never create a parallel scheduler.

This migration intentionally does not solve Tavily HTTP 432 usage quota, stale external source evidence, revenue snapshot timeout, missing customer-finance forecasts, or portal PR #4475 production acceptance.
