# Production → GitHub migration lineage reconciliation v1

Contract: `powerhouse-repo-production-migration-lineage-v1`

## Incident

Supabase production was ahead of GitHub migration lineage for already-applied Powerhouse migrations. GitHub contained semantically identical SQL under local timestamps, while the authoritative Supabase migration ledger recorded different production versions. That created provenance/replay risk even though runtime behavior was already live.

## Root cause

Migration SQL was applied to production through the governed Supabase path, which recorded the actual production migration version, while later repository consolidation preserved local repository timestamps instead of the exact production ledger versions. A second contributing defect was closure truth drift: repository tests/config could still state `PENDING_MAIN_READBACK` after the canonical production obligation had independently reached `FULFILLED`.

## Reconciliation

Production ledger is authority. Exact production filenames replaced their timestamp aliases without replaying DDL. The canonical manifest is `config/supabase-production-migration-lineage.json`.

The original Revenue Intelligence reconciliation included:

- `20260915172800_powerhouse_revenue_intelligence_health_truth_v3.sql` → `20260915152705_powerhouse_revenue_intelligence_health_truth_v3.sql`
- `20260915173100_powerhouse_commercial_progression_forecast_bridge_v1.sql` → `20260915153015_powerhouse_commercial_progression_forecast_bridge_v1.sql`
- `20260915153500_powerhouse_forecast_lineage_sequencing_v1.sql` → `20260915153617_powerhouse_forecast_lineage_sequencing_v1.sql`
- `20260915154000_powerhouse_outcome_readback_health_semantics_v1.sql` → `20260915154107_powerhouse_outcome_readback_health_semantics_v1.sql`

The same invariant later covered replay-hardening aliases as recorded in the manifest. No already-applied production schema operation is replayed by repository reconciliation.

## Verified closure

The canonical production obligation `powerhouse-repo-production-migration-lineage-v1` / `repo-production-migration-lineage-reconciliation-v1` now independently reads:

- state: `FULFILLED`
- version: `4`
- closed-loop status: `LIVE & BEWEZEN`
- original reconciliation PR: `#1607`
- original merge SHA: `ea4fa8ec9e256b86654922817fa1040aa3195798`
- production DDL replayed: `false`
- production behavior changed: `false`
- production readback verified: `2026-09-15T16:42:22.548426Z`

A fresh production-ledger readback on 2026-09-17 observed later valid migrations through `20260917070302_linkedin_company_daily_delivery_guard_v1`; the reconciled historical entries remain valid lineage inside that newer ledger.

## Prevention

`config/supabase-production-migration-lineage.json` records the canonical production evidence boundary and `tests/supabase-production-migration-lineage-contract.test.mjs` fails when a reconciled production filename is missing, an alias reappears, a semantic migration is duplicated, or terminal closure evidence contradicts the canonical Brain obligation.

For future production-first migrations:

1. read back the exact Supabase `version + name` after production execution;
2. commit that exact lineage to GitHub—never a locally invented timestamp alias;
3. never replay already-applied DDL merely to make repository history look aligned;
4. keep closure fail-closed until protected-main CI, GitHub readback, production-ledger readback and Brain-obligation readback all agree;
5. after closure, repository manifest/tests/documentation must transition from pending state to terminal `LIVE_VERIFIED` / `FULFILLED` truth so stale documentation cannot reopen ambiguity.

## Reusable learning

Migration lineage is a production-truth problem, not just a filename problem. A system can be functionally live while its provenance is unsafe. The prevention pattern is therefore: **production ledger authority → exact-name repository parity → no semantic duplicate → protected merge → dual readback → canonical obligation closure → repository closure-truth synchronization**.
