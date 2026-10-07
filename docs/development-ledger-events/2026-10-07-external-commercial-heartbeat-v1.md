# 2026-10-07 — External commercial heartbeat recovery

- Obligation: `external-commercial-heartbeat-20261007-v1`
- Base main: `80cbbc27920227c21e9a7c1fef686d67c4eb93c2`
- Production evidence: heartbeat cron job 154 started alone at 06:50:05 UTC and failed with `job startup timeout` at 06:50:15 UTC.
- Runtime conclusion: commercial heartbeat availability cannot depend on pg_cron client-connection startup.
- Scheduler authority: Netlify scheduled dispatcher, offset to minute 2/7/12/... UTC.
- Long-running delivery: protected Netlify background function with bounded retries.
- Database authority: Supabase Edge runner over IPv4 Supavisor transaction transport, max one connection per isolate.
- Concurrency: transaction advisory lock.
- Success criterion: fresh VERIFIED durable `commercial_heartbeat` runtime-event readback.
- Legacy pg_cron job 154 remains active until external live proof succeeds.
- Regression authority: `tests/brain-external-commercial-heartbeat-v1.test.mjs`.
