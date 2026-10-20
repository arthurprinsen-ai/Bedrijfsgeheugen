# P0 #4215: Remove full commercial NBA re-expansion for forecast evidence

## Measured production evidence
- The canonical revenue snapshot function ran 618 times in pg_stat_statements with historical mean 88.1 seconds. It refreshes from `powerhouse_commercial_next_best_action_v5`.
- A nonexecuting EXPLAIN for the existing v5 expanded roughly 801 query nodes with planner cost 153.4M.
- `powerhouse_action_evidence_maturity_v1` fetches only `nba.forecast_id` from `powerhouse_commercial_next_best_action_v4`, creating a second expansion of that heavy chain. The exact forecast selection in `powerhouse_buying_window_v2` comes from `powerhouse_opportunities` plus the winning active/claimed `powerhouse_forecasts` row.
- A proposed rewrite directly using that identical forecast ranking reduces nonexecuting estimated cost to 97.0M and plan nodes to 585 (~37% cost reduction). **This is a planning estimate, NOT observed execution speed.**

## Scope and guards
One existing view's join is optimized; existing output columns, action lineage, historical value/evidence gates, financial truth semantics, job 46 & 116, authentication/tenant RLS and source rules remain. Requires canonical unique opportunity_key and unchanged source view before CREATE OR REPLACE VIEW. No schema privilege expansion, no fabricated values, no job pause, no data deletion. DDL is transactional with lock_timeout 2s and statement_timeout 15s.

## Critical deployment gate
Never merge without Supabase Preview success on the exact PR SHA. Compare full row count, action_id, forecast_id, calibration-eligible and channel counters from old and new on isolated preview, and post-change revenue snapshot + tenant separation. This draft static contract does not by itself prove parity. Then check Required CI and CodeQL, protected merge, exact production migration readback, materialized snapshot refresh and authenticated portal HTTP 200. Document discrepancies and abort if any.


## Forward-only preview security readback
The first preview execution had already recorded migration version 20261020163500 before the security_invoker correction. To avoid editing applied history, migration 20261020163501 enforces `ALTER VIEW ... SET (security_invoker=true)` and `REVOKE ALL FROM PUBLIC, anon, authenticated`, then verifies both privileges and the service-role boundary transactionally. The observed production view already has these exact settings. Stop if readback differs; no merge until preview matches.
