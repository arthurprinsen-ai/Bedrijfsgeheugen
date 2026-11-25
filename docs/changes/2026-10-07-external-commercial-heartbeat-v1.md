# External commercial heartbeat v1

The commercial heartbeat remained unreliable after database cron fan-out was reduced. Production evidence showed heartbeat job 154 timing out during pg_cron connection startup even when no other POWERHOUSE cron started in the same heartbeat slot.

Structural correction:

- Netlify schedules a lightweight dispatcher at minute 2/7/12/... UTC, offset from the legacy pg_cron heartbeat.
- The dispatcher hands work to a Netlify background function and returns immediately.
- Background delivery reuses the existing protected service token and retries with bounded backoff.
- A dedicated Supabase Edge runner executes `powerhouse_commercial_heartbeat_v1` through the IPv4 Supavisor transaction pool, with one connection per isolate.
- A transaction advisory lock prevents overlapping external heartbeat runs.
- A run is successful only when a fresh VERIFIED `commercial_heartbeat` runtime event is read back durably.
- The existing outbound-copy quality gates remain fail closed.

Cutover is deliberately two phase. The existing pg_cron heartbeat remains active until the external path has produced live durable evidence. Only then may the legacy cron owner be retired.

## Live cutover proof

At 2026-10-07 08:37:34 UTC the external heartbeat produced durable event `commercial-heartbeat:202610070837` with `state=actioned`, `data_quality=VERIFIED`, confidence 1, while the Edge runner returned HTTP 200. Production migration 20261007083900 then retired the legacy pg_cron heartbeat owner by jobname after an exact owner-count guard. Production migration history is now 605 entries and no `powerhouse-one-commercial-heartbeat-v1` cron job remains.
