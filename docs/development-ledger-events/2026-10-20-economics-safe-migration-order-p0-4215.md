# Economics recovery replay-order dependency

Obligation-ID: portal|bounded-internal-research-economics|20261020
Parent-P0: #4215
State: REVIEW_CANDIDATE / NOT_LIVE

Actual provider failure after protected #4548 / a1024c15c9c14c3f66b42b148e082b18a02e5684: check 118618278557 completed 2026-10-20T12:08:19Z with SQLSTATE 57014 at CREATE INDEX bronpublicaties_portal_latest_p04215_idx in 20261020113000. That was not the economics index, and the function-only recovery at 143000 was later in canonical replay. Source history parity and passing previews did not prove this recovery could reach production.

One sequential same-obligation candidate: exact protected #4546 function source projected before that blocker as 112220; exact protected #4540 economics index in its own guarded 112221 transaction. Preserve all original identities and producer/cron/data/cost/security invariants. No production DDL/history mutation, restart, capacity increase, timeout increase or scheduler disable. Red-first regression: 2 failed / 1 passed before files; green after exact source projections. Normal protected gates and actual production evidence remain required. Other portal index recovery and two-tenant #4215 acceptance stay open.
