# 2026-10-07 — external heartbeat ledger 607

- Base main: `d368d2774d1f9bd31dbafb9abbfee60758de1b38`.
- Production remote migration ledger: 607.
- New remote identity: `20261007091140_restore_single_staggered_commercial_heartbeat_owner`.
- Cause: emergency pg_cron heartbeat restoration while canonical external Edge promotion was blocked by migration-ledger drift.
- Canonical end state: external Netlify → Supabase Edge scheduler only; legacy pg_cron retired.
- Repository migration 607 deliberately converges to the canonical end state instead of recreating the temporary emergency owner.
- Regression authority: `tests/brain-external-heartbeat-ledger-607-v1.test.mjs`.
- Next proof: exact-HEAD gates → protected squash merge → provider runner marker parity → legacy owner retirement → fresh durable heartbeat + runtime error window.
