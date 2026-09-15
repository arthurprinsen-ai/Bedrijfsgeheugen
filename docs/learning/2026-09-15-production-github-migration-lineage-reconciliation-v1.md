# Production → GitHub migration lineage reconciliation v1

Contract: `powerhouse-repo-production-migration-lineage-v1`

## Incident

Supabase production was ahead of GitHub migration lineage for four already-applied Powerhouse migrations. GitHub contained the same semantic SQL under local timestamps, while the authoritative Supabase migration ledger recorded different production versions.

## Root cause

Migration SQL was applied to production through the governed Supabase path, which recorded the actual production migration version, while later/current-main consolidation preserved local repository timestamps instead of the exact production ledger versions. This created provenance drift even though runtime behavior was already live.

## Reconciliation

Production ledger is authority. The following repository aliases are replaced without replaying DDL:

- `20260915172800_powerhouse_revenue_intelligence_health_truth_v3.sql` → `20260915152705_powerhouse_revenue_intelligence_health_truth_v3.sql`
- `20260915173100_powerhouse_commercial_progression_forecast_bridge_v1.sql` → `20260915153015_powerhouse_commercial_progression_forecast_bridge_v1.sql`
- `20260915153500_powerhouse_forecast_lineage_sequencing_v1.sql` → `20260915153617_powerhouse_forecast_lineage_sequencing_v1.sql`
- `20260915154000_powerhouse_outcome_readback_health_semantics_v1.sql` → `20260915154107_powerhouse_outcome_readback_health_semantics_v1.sql`

No production schema operation is part of this reconciliation. These migrations are already present in production.

## Prevention

`config/supabase-production-migration-lineage.json` records the canonical production evidence boundary and `tests/supabase-production-migration-lineage-contract.test.mjs` fails when a reconciled production filename is missing, an alias reappears, or a semantic migration is duplicated.

For future production-first migrations, exact Supabase `version + name` must be read back and committed to GitHub before the corresponding writeback obligation can be closed. A GitHub merge alone is not completion.

## Closure gate

The existing Supabase obligation `powerhouse-repo-production-migration-lineage-v1` / `repo-production-migration-lineage-reconciliation-v1` remains `OPEN` until:

1. required CI is green on the reconciliation PR;
2. the reconciliation is merged to current `main`;
3. GitHub `main` is read back and contains all exact production filenames with no aliases;
4. Supabase production migration history is read back again and still contains those exact versions/names;
5. the obligation evidence is updated with exact merge/readback proof and state `FULFILLED`;
6. that `FULFILLED` state is independently read back from production.
