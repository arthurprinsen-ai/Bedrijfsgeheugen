# 2026-10-07 — Commercial heartbeat attribution decoupling

- Base main: `f46f24d26651e915639fe4b1bb3fb75ff8bee4d5`.
- External heartbeat transport is already live through Supavisor, but runner logs repeatedly show statement/lock timeouts inside `powerhouse_refresh_revenue_attribution_snapshot_v1`.
- The full attribution refresh was still synchronously owned by the five-minute heartbeat even though the runtime scheduler mux already owns that refresh at 7/22/37/52.
- This recovery makes the heartbeat a read-only consumer of the durable attribution snapshot/health projection.
- Quality remains fail-closed on `attribution_balanced`; freshness and missing-touch gaps remain evidence.
- Terminal proof remains: protected merge → production migration/provider readback → externally scheduled heartbeat 200 with durable VERIFIED runtime-event readback → retire legacy pg_cron heartbeat job 154 → fresh runtime error readback.
