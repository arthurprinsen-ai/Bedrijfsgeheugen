# P0 #4198 — isolate commercial scoring query load
2026-10-11; canonical project `adhjwmvyoixzjtmiroln`.

## Diagnosis
The existing hourly pg_cron job 116 (`powerhouse-commercial-learning-v1`) was ACTIVE, but its latest 8 runs failed with `canceling statement due to statement timeout` after approximately two minutes. Traceback identifies the `with scored as` statement in `powerhouse_autonomous_growth_revenue_cycle`. The query repeats correlated scans for open opportunities against predictive signals, forecasts and recorded outcomes. Live data at diagnosis: 633 open opportunities, 2,137 signals, 4,763 forecasts, 1,635 outcomes. Existing indexes did not cover the scorers' entity, forecast scope/topic and outcome attribution correlation keys.

## Change already deployed to production
Applied a non-destructive Supabase migration `20261011094454_powerhouse_commercial_correlated_lookup_indexes_p0_4198` adding seven IF NOT EXISTS partial B-tree lookup indexes, then analyzed the three touched tables. This GitHub file preserves **the exact original migration version** for source parity. Index readback from a read-only EXPLAIN of the actual signal predicate shows a BitmapOr using the new `ph_predictive_signals_entity_lookup_p0` index and existing topic index.

## Non-goals / safety
No new cron, queue, publisher, CRM, provider permissions, emails, DM or outbound sends. No existing commercial or Brain function was replaced. No identity/consent/pressure/readback gates bypassed; no fact or revenue was generated. This cannot be considered FULL_GREEN merely because an index exists. `Supabase Preview` has an earlier migration-version mismatch and requires independent repair, not reapplying already-applied migrations.

## Remaining acceptance
Re-run the original job 116 at its canonical schedule and confirm SUCCESS in `cron.job_run_details`, measure query latency and any remaining bottlenecks, confirm per-channel provider receipts, attribution and learning. Maintain P0 OPEN until verified end-to-end evidence.

## 2026-10-11 10:12 UTC — Supabase Preview repair evidence
The existing ephemeral branch linked to this PR was in `MIGRATIONS_FAILED` (duplicate historical version `20260915094213`). Applied the supported `rebase_branch` action to the **existing preview branch only** (no production reset and no new project), preserving branch identity. The Supabase branch control-plane then reported `FUNCTIONS_DEPLOYED`. Read-only `list_migrations` on preview project `pgcrjnmvhnwammnvybmc` confirms that version `20261011094454` is applied, and `pg_indexes` confirms all seven new canonical scorer lookup indexes on the preview database. A fresh immutable commit and hosted check readback is required for the protected GitHub `Supabase Preview` gate to turn green; historical failed check entries must not be presented as green.
