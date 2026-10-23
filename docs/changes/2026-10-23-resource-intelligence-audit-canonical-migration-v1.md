# Resource Intelligence CI audit — migration lineage repaired

Date: 2026-10-23. Existing CI delivery owner [#4661](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661); related Supabase migration history owner [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215).

## Exact provider incident

[Powerhouse Resource Intelligence run #39937291073](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39937291073) failed in job `audit` because `scripts/brain/resource-intelligence-audit.mjs` required a non-existent `20260917093000_powerhouse_resource_intelligence_v1.sql`. The source repo and Supabase production migration ledger both show `20260917094812_powerhouse_resource_intelligence_v1.sql` and `20260917094941_powerhouse_resource_intelligence_v1.sql`, identical Git blob content. Existing resource-intelligence tests already use the first canonical file.

The stale audit also expected nonexistent `energy_wh`, `water_ml` and provenance-name tokens. The applied SQL actually uses `energy_kwh`, `water_liters`, `co2e_kg`, `factor_coverage` and `provenance_complete` with filtered NULL-preserving sums.

## Bounded correction

Correct the original audit pointer to the already-applied 09:48 migration and make its **positive** guardrails match the actual physical measurements, provenance, invoker security, forced RLS and optimization/compliance objects. Preserve strict negative guards: unknown energy/water/carbon can never be `COALESCE(...,0)`. Add tests that run the real audit and compare to the pinned migration path.

There is **no new Supabase migration, no manual SQL write, no new scheduler, no permission upgrade, no new Brain or queue**. Existing BG169 and all required gates remain unchanged.

## Acceptance

`node --test tests/powerhouse-resource-intelligence-contract.test.mjs` and `node scripts/brain/resource-intelligence-audit.mjs --check` must both succeed on the exact candidate. Then normal hygiene/preflight/Required/CodeQL protected merge, and the existing **next natural resource intelligence workflow** must independently succeed on protected main. Source correctness or historical production migration status alone does not prove that future daily resource telemetry is complete or that financial/environmental ROI is realized.
