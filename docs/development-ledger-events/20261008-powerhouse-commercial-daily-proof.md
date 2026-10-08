# 2026-10-08 · Powerhouse daily commercial evidence repair

- Canonical owner: existing Powerhouse commercial runtime and Supabase `powerhouse_sales_actions`.
- Failure fingerprint: `powerhouse|commercial-daily-proof|stale-expired-self-reselection|2026-10-08`.
- Found one 2026-10-07 expired LinkedIn reply action incorrectly classified as an active 2026-10-08 sales decision because `updated_at` was modified by the heartbeat.
- Changed `powerhouse_reconcile_current_commercial_action_set_v2` using existing migration lineage; excluded `expired` actions, replaced mutable heartbeat date evidence with `due_at`, and superseded previously active terminalized rows.
- Production SQL readback: `active_count=0`, `superseded_count=1`; independent commercial assurance state `DEGRADED_NO_CURRENT_DAILY_ACTION_SET` (`healthy=false`).
- This is a truthful failure detection improvement, **not** a provider-confirmed send or an increase in realized revenue. Maintain the existing dispatch and provider readback ownership; no second scheduler/CRM introduced.
- Canonical PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4115
