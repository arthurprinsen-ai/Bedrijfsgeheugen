# 2026-10-07 — Runtime cron pressure relief

- Obligation: `runtime-cron-pressure-relief-20261007-v1`
- Base main: `2ab7a41122430abae6761c08d637a419b5e1d9af`
- Production evidence: repeated pg_cron startup timeouts, including commercial heartbeat job 154; PostgREST schema cache statement timeouts; intermittent Management SQL connection timeouts.
- Existing every-minute owners: execution-resilience watchdog + reconciliation worker.
- Correction: one advisory-lock-protected minute maintenance tick.
- Watchdog remains every minute.
- Reconciliation shares the same session and does not run on five-minute commercial heartbeat slots.
- Commercial heartbeat owner/schedule remain unchanged.
- Regression authority: `tests/brain-runtime-cron-pressure-relief-v1.test.mjs`.
- Required terminal proof after merge: cron owner readback, reduced startup-timeout evidence, fresh commercial heartbeat, durable event readback.

- Migration-lineage readback: production ledger count 593; latest `20261007060126_powerhouse_runtime_cron_pressure_relief_v1`.
- Provider failure after #4030: `Remote migration versions not found in local migrations directory` because Git carried alias `20261007055200`.
- Repository-only repair: exact production version restored, alias removed, lock advanced to 593; no production DDL replayed.
