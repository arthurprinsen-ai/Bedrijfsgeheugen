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

## Recurrence and escalation — 17 September 2026

The same failure class recurred during Powerhouse Closure A-F reconciliation. PR `#1796` correctly identified production-ledger drift, but the branch accumulated unrelated/stale quality-surface changes while protected main kept moving. It was therefore not a valid final reconciliation candidate and was closed without merge.

The canonical repair was successor PR `#1859`, created from current protected main and scoped only to the still-valid three migration-identity deltas. It reused the existing SQL blobs under the exact production identities and removed only the local aliases:

- `20260916195037_powerhouse_closure_a_f`
- `20260916195048_powerhouse_closure_strict_cycle`
- `20260916195056_powerhouse_closure_legacy_learning_seed`

PR `#1859` merged as `6fe90c543fbaf9d75ef1e117a0fda02927b2d3c0`. Git readback and live Supabase migration-history readback reported the same exact identities; the old `220000/220100/220200` aliases were absent. PR `#1796` is historical evidence only and must remain superseded.

This adds a second-order learning: migration-lineage repair is not only about exact filenames. The repair branch itself must remain identity-clean and scope-clean. A stale branch that contains unrelated fixes is not made safe by green local tests or by the correctness of one subset of its changes.

## Prevention

`config/supabase-production-migration-lineage.json` records the canonical production evidence boundary and `tests/supabase-production-migration-lineage-contract.test.mjs` fails when a reconciled production filename is missing, an alias reappears, or a semantic migration is duplicated.

For future production-first migrations, exact Supabase `version + name` must be read back and committed to GitHub before the corresponding writeback obligation can be closed. A GitHub merge alone is not completion.

Additional permanent rules after the 17 September recurrence:

1. **PRODUCTION_LEDGER_IDENTITY_IS_IMMUTABLE_AUTHORITY** — never semantically renumber or replay already-applied migrations merely to align Git history.
2. **STALE_RECONCILIATION_BRANCHES_ARE_NOT_MERGE_CANDIDATES** — if protected main moves or a repair branch accumulates unrelated scope, classify the branch as historical/superseded rather than forcing it through.
3. **FRESH_MAIN_MINIMAL_DELTA_ONLY** — create a successor from current protected main and transplant only the still-valid, evidence-backed delta.
4. **NO_UNRELATED_GATE_FIXES_IN_LINEAGE_REPAIR** — quality-surface, CI, test-harness or other independent repairs belong in their own authority unless they are strictly required for the migration-lineage capability itself.
5. **EXACT_IDENTITY_READBACK_BEFORE_CLOSURE** — closure requires Git main and live Supabase migration history to agree on exact production versions/names, with stale aliases absent.
6. **SUPERSESSION_IS_EXPLICIT_LINEAGE** — the obsolete PR remains referenced as historical evidence, but the successor PR and merge SHA become canonical authority.

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
