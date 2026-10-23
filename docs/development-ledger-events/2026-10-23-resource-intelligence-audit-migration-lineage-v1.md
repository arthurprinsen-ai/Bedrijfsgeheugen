# Append-only development ledger — Resource Intelligence audit migration lineage

Date: 2026-10-23
Obligation-ID: `delivery|resource-intelligence|stale-migration-audit-pointer|20261023-v1`
Owner: existing Powerhouse CI delivery, Brain and Supabase migration-history governance.

- OBSERVED: GitHub workflow #39937291073 audit job #120359836809 failed `missing required artifact: supabase/migrations/20260917093000_powerhouse_resource_intelligence_v1.sql`.
- CAUSAL: Old audit points to a migration filename missing from the repo and checks obsolete measurement tokens.
- SOURCE/PRODUCTION RECONCILIATION: `20260917094812` and `20260917094941` canonical migrations have identical Git blob SHA and both were reported by Supabase `list_migrations` as applied.
- RECOVERY: No new migration or DB write. Audit now pins the historical applied 09:48 source; source-field checks use energy_kwh, water_liters, co2e_kg, provenance and explicit null-not-zero semantics.
- PREVENTION: Execute the real audit from regression tests and assert the valid historical migration path. Reject synthetic zero resource measurements, no permission/budget/scheduler changes.
- VERIFY: Protected immutable-head Required + CodeQL + actual Powerhouse Resource Intelligence production workflow readback. Candidate green is not customer business value, resource-factor completeness or proof of physical emissions.
- ROLLBACK: revert only this bounded audit/test/learning/ledger change if source contract mismatch or CI regressions; never change applied production migrations to satisfy an erroneous filename.

Status: CANDIDATE_NOT_LIVE until independently verified merge/readback.
