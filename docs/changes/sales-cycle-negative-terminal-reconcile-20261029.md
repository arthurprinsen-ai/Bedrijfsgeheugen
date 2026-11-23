# Source-verified terminal state for non-executed sales actions

Date: 2026-10-29. Obligation-ID: powerhouse-negative-terminal-reconciliation-20261029
Status: SOURCE_CANDIDATE_NOT_LIVE

Protected PR #5109 fixed the *future* false execution event bug. Follow-up source join found 5,190 canonical cycles still showing `outcome_pending` (4,879 expired, 311 skipped), with source `executed_at NULL`, exact linked `not_executed` outcome and zero revenue. These are not delivered messages, leads or paid orders.

This migration is limited to two changes within existing ONE BRAIN:
1. Existing canonical `powerhouse_advance_sales_action_v1`: include `skipped` with `error` and `expired` statuses that mark cycle `blocked`; preserve the previously-proven `done AND executed_at` gate.
2. One transactionally bounded, idempotent `UPDATE` to *mutable* `powerhouse_decision_cycles.status` for independently verified negative actions/outcomes, never to immutable `powerhouse_cycle_events` or underlying commercial actions/outcomes. Emits an aggregate migration rowcount notice.

No synthetic successes, no change to provider send, RLS, credentials, event history, writer, cron or schedule. Historical stage-labelled execution evidence must still be source-joined for truth. Protected GitHub checks + Supabase preview + production migration and row-count verification needed to close.
