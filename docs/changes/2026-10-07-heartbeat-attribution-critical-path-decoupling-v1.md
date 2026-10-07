# Decouple attribution refresh from the commercial heartbeat

## Incident

The external Netlify → Supabase Edge heartbeat is deployed and invoked correctly, but production did not create a new durable `commercial_heartbeat` event. Supabase function logs proved that requests reached the Edge runner and authenticated successfully.

The remaining failures were inside the database transaction:

- Supavisor `ECHECKOUTTIMEOUT`;
- PostgreSQL `lock timeout`;
- PostgreSQL `statement timeout`;
- stack traces consistently entered `powerhouse_refresh_revenue_attribution_snapshot_v1()` through the revenue spine.

The runtime scheduler also refreshed attribution at minutes **7/22/37/52**, which directly overlaps the external heartbeat schedule **2/7/12/.../57**.

## Structural correction

- The latency-critical revenue spine no longer materializes attribution.
- It reads a small cached attribution receipt instead.
- Full attribution refresh remains a maintenance responsibility at **4/19/34/49**.
- The runtime mux cron excludes both heartbeat families: legacy **0 mod 5** and external **2 mod 5**.
- Content closed-loop moves from external heartbeat slots to **4 mod 5**.
- Data-spine watchdog moves from the previously unreachable **0 mod 10** condition to **1 mod 10**.
- Existing commercial quality, terminal-lineage and provider gates remain unchanged and fail-closed.

## Terminal proof required

After protected merge: Supabase migration readback → external Edge heartbeat returns durable VERIFIED receipt → legacy pg_cron heartbeat job 154 retires → fresh 401/500/503/522 window → POWERHOUSE_ONE / LIVE_PROVEN.
