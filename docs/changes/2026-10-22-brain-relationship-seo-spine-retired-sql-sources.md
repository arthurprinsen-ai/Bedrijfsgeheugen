# BRAIN baseline: relationship / SEO / spine historical SQL contract recovery

- Obligation: ci-brain-retired-sql-source-relationship-seo-spine-20261022
- Parent: #3742; blocked portal PR: #4573
- Baseline: full Unified BRAIN run 39671036043, backend job 119469063095 (3,511 tests; 3,190 pass, 321 fail)
- Cause: five inherited SQL contract test modules try to load seven retired executable migration paths; original historical SQL remains in immutable repository-only archive.
- Correction: seven path replacements across exactly five original test modules. Assertions, security negatives, and runtime unchanged.
- Archive identity: 
  - `20260928114500_powerhouse_linkedin_sales_machine_v1.sql` blob `4b56a5333818c81b7e074341182460d3dc45a992`
  - `20260928115000_powerhouse_linkedin_sales_machine_cycle_v1.sql` blob `5507619ad8dd309010e12e02eda8c3e1c00a024f`
  - `20260928173100_powerhouse_relationship_external_intelligence_v1.sql` blob `ce3e9d346de8274d8356a6ee841c67ad3229e5e0`
  - `20260924072500_powerhouse_seo_opportunity_resolver_v1.sql` blob `6a9ba57a8a97edf16fee5c21f243ac6729962d40`
  - `20260918095000_powerhouse_unified_data_intelligence_spine_v1.sql` blob `b8f754c43c6d872232148a2dee07e3c11c32b8aa`
  - `20260918102000_powerhouse_data_spine_heartbeat_truth_v1.sql` blob `7d292f0c897f14b8b5bedb06ed786b8f0055a222`
  - `20260918104500_sales_action_signal_cycle_materializer_v1.sql` blob `024fa031562eb1f374da17f00bed9735c13bb2ff`
- Prevention: tests/brain-inherited-relationship-seo-spine-archive-v1.test.mjs rejects retired paths, missing archive SQL and accidental executable restoration.
- Exclusions: No executable migration, schema, RLS, ACL, workflow, provider, scheduler, runtime, tenant data or production changes. No overlap with active SQL recovery drafts #4605, #4608, #4610, #4616, #4617.
- Verification status: source readbacks only, Node / Required / CodeQL / full BRAIN not yet proven. No projected test reduction claimed until a fresh exact-head runner.
- Release: exact-head Required CI and CodeQL and FULL Unified BRAIN (0 failing) required; #3742 clean-room parity and #4215 real authenticated two-tenant acceptance remain independent.
