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


## Required full semantic parity gate (added 2026-10-20)
- The live original view has **51** ordered columns. Static SQL-pattern assertions and identical-looking output names **do not** prove equivalence.
- Execute tests/brain-p0-4215-maturity-full-parity.mjs against an **isolated, pre-migration Supabase Preview** populated with authorized data representing at least two distinct tenant IDs. This is a shadow-SELECT comparison, not an instruction to reapply migration SQL.
- Example command (using secrets supplied in an approved CI/private execution context; never commit credentials):

    P0_4215_PARITY_ENV=isolated-preview P0_4215_PREVIEW_PROJECT_REF=<preview-project-ref> P0_4215_PREVIEW_DATABASE_URL=<preview-postgresql-url> node tests/brain-p0-4215-maturity-full-parity.mjs

- The runner parses the actual candidate view from the same versioned migration, creates a **temporary** candidate view, snapshots old and candidate under one repeatable-read database snapshot, and checks exact ordered column names/types, nonempty equal row cardinalities, bidirectional full 51-field EXCEPT ALL comparisons including NULL/array/forecast values, and tenant/channel/status/maturity/calibration/financial aggregations.
- It refuses production project credentials, refuses an already-replaced baseline, refuses empty results or fewer than two distinct represented tenants, prints no customer data, creates no persistent schema changes, and rolls back its temporary objects.
- A pass is valid only against the **exact PR head**, with a provider-owned preview migration/readback on that same commit; rerun after any candidate SQL changes.
- **Separate mandatory acceptance** remains: role-level readback (security_invoker, anon/authenticated denied, internal service account approved), two distinct *authenticated customer* HTTP 200 portal sessions proving no cross-tenant data disclosure, measured execution latency without HTTP 504, refreshed revenue snapshot, Required CI + CodeQL, protected merge, and post-deploy production readback.
- A with_data=false Supabase preview has zero business rows and **cannot** pass the semantic or tenant gate. Obtain permitted representative preview data and run the gate before marking the PR ready; no zero-row waiver, forced merge or production DDL.

## Forward-only expression index for keyed forecast fastpath — 23 October 2026

Read-only production catalog inspection found existing partial `ph_forecasts_active_scope_lookup_p0` on the raw `scope_key`, but none on `lower(scope_key)`, while the PR's LATERAL forecast resolver uses `lower(pf.scope_key)=lower(opp.company_key/person_key)`. PostgreSQL historical cumulative `pg_stat_user_tables` reports 5,258,739 sequential scans and 21,217,760,748 tuples read on `powerhouse_forecasts`. These counters indicate a search for indexable predicates, **not causal proof** for cron #46. Actual read-only candidate maturity evaluation of 51 fields took 39,576.821 ms; combining it with the still-unoptimized production NBA v4 exceeded a bounded 90-second test. No end-to-end production SLA result is claimed.

A distinct, guarded migration `supabase/migrations/20261023064000_p0_4215_forecast_scope_lower_idx.sql` adds one partial expression index for active/claimed forecast scope lookups. It does not alter rows, forecast ranking, economic meanings, tenant grants, role policies, or schedulers, and adds a focused index/schema regression test `tests/brain-p0-4215-forecast-scope-lower-index.test.mjs`. The original maturity view migration is not overwritten. PR remains DRAFT until provider-owned migration, protected Required/CodeQL, full representative financial/channel/51-column parity and independently authenticated tenant and complete cron readbacks succeed. Avoid index-performance claims before a measured indexed plan.
