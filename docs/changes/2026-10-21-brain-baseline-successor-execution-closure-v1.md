# BRAIN baseline successor: execution-learning SQL archive contract
Date: 2026-10-21
Parent-P0: #3742
Related-P0: #4215
Blocked-Portal-PR: #4573
Obligation-ID: ci-inherited-content-closed-loop-history-pointers-20261021
Supersedes-PR: #4595
Base-SHA: 9130957e1f444dddc2cd512eab74b575125f7428
Original-Candidate-SHA: 50be86133d5a8008fa0e380d044e6dfa8814ac91

Original canonical Unified BRAIN run 39660607012: 3500 tests, 3171 passed, 329 failed. No inherited test was disabled or omitted.

The old branch #4595 was based on main d18ef16e, while protected main moved to 9130957e1f444dddc2cd512eab74b575125f7428. The 12 old candidate paths and newer main portal paths were compared and had zero overlap. The successor builds its tree from the exact current main and transplants the 12 prior unchanged candidate blobs, preserving both portal main commits.

Five original tests in `tests/supabase-execution-learning-closure-v1.test.mjs` read the missing executable migration SQL `supabase/migrations/20260915162000_powerhouse_execution_learning_closure_v1.sql`. The immutable source is in `supabase/migration-history/repository-only/20260915162000_powerhouse_execution_learning_closure_v1.sql`, blob c25b5b2a8e11b5683adb3adee268ec1727e70543. All 31 source-positive patterns and three forbidden patterns were checked independently. Only the read path changes; the six-case original suite, provider metrics, calibration, advisory locking, service-role boundaries, and scheduler checks remain intact.

A BRAIN-prefixed wrapper imports the original six-case file unchanged in historical replay, shadow and canary. The previously known 329 failures are NOT claimed fixed; up to five source-path failures are candidates for removal on the next complete independent Unified BRAIN run.

No runtime application, migrations directory, database, schema_migrations, scheduler, provider, customer, auth, RLS or production deploy is modified. Protected exact-HEAD Required CI, Powerhouse CodeQL and full Unified BRAIN MUST all succeed before merge. #3742 supported migration-history parity and clean-room replay, plus #4215 real two-tenant evidence, remain separate nonwaivable obligations.
