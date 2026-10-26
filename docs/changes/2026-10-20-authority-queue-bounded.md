# 20 October 2026 — bounded authority queue (P0 #4198)
## Root cause
Repeated prod 30s statement timeouts and Cron startup timeouts prevented social/commercial progress. Current `powerhouse_contact_authority_review_batch_v1` filters and sorts joined CRM records and suppression gates **before** LIMIT. The manual Cron reduction mitigates bursts but not this query shape.
## Fix
On the EXISTING SQL function, select at most p_limit unreviewed state rows into a materialized CTE with `FOR UPDATE OF s SKIP LOCKED` and only then join the CRM + compute exactly unchanged email/consent/suppression/cooldown state. Add `(enriched_at, person_key)` queue index. A fail-closed migration transforms the currently active source only when its protected anchors match, otherwise aborts. Canonical cron job stays active with one bounded pulse and one review batch; keep schedule and other tasks unchanged.
## Acceptance
Native Supabase Preview, Required test/CodeQL, protected merge, live SQL apply, source/Cron/index readback, real successful batch and decreasing 30s errors, plus eventual per-recipient provider receipt. This SQL fix does not license SalesRobot, fabricate Instagram media or authorize unsolicited outreach.
