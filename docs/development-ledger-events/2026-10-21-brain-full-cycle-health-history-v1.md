# Full-cycle health source contract repair
Date: 2026-10-21
Obligation-ID: ci-inherited-content-closed-loop-history-pointers-20261021
Parent-P0: #3742
Related-P0: #4215
Candidate-PR: #4602
Prior-Head: 59d14cb8669be96f2fbf89d9adf972f4d5251446
Prior-Full-BRAIN-Run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39669956039

Three previous BRAIN tests failed because the SQL path under executable migrations no longer exists. The original immutable `supabase/migration-history/repository-only/20260915124000_powerhouse_full_cycle_health_status_fix_v1.sql` has Git blob `e9ab64e8f5592d69b7205a2834c87d9798d222d0`, eleven original required patterns and one original forbidden pattern checked. The change replaces only the source read path in `tests/supabase-powerhouse-full-cycle-health-status-fix.test.mjs`, preserving every actual assertion and the service-role, RLS/proof, status constraint, and scheduler conditions. The original three cases are additionally imported in BRAIN historical replay, shadow and canary. Prior full BRAIN had 3508 tests, 3184 pass, 324 fail; no claimed reduction until independent full BRAIN execution succeeds.

No SQL is copied to `supabase/migrations`; no migrations, schema, runtime, provider, RLS, scheduler or production deployment change. Required CI, CodeQL and complete exact-head Unified BRAIN remain protected and non-waivable, with #3742 migration parity and #4215 genuine authenticated tenant acceptance still independently open.

Status: CANDIDATE_SOURCE_PROVEN_CI_PENDING; no protected merge or production change.
