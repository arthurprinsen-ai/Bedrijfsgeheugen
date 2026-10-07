# 2026-10-07 — heartbeat attribution critical-path decoupling

- Base main: `f46f24d26651e915639fe4b1bb3fb75ff8bee4d5`.
- Production migration authority before this change: 603 migrations, latest `20261007064948`.
- Supabase provider deployment for `powerhouse-commercial-heartbeat-runner` is proven.
- Edge calls are reaching production; failures occur after authentication in the DB transaction.
- Observed runtime failures: `ECHECKOUTTIMEOUT`, lock timeout and statement timeout.
- Production stack enters `powerhouse_refresh_revenue_attribution_snapshot_v1()`.
- Existing runtime mux attribution slots 7/22/37/52 collide exactly with external heartbeat slots.
- Recovery migration: `20261007081000_decouple_attribution_from_commercial_heartbeat_v1.sql`.
- Regression authority: `tests/brain-heartbeat-attribution-decoupling-v1.test.mjs`.
- No quality gate, authentication contract or provider-write authority is weakened.
