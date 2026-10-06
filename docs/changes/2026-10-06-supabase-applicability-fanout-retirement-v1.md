# Supabase applicability fan-out retirement v1

The standalone all-PR `Supabase Preview Applicability` workflow is retired.

Its exact-head provider proof is already change-scoped inside the protected `Required test` workflow on `main`. Branch protection now requires only `test` and `CodeQL javascript-typescript`, with strict up-to-date enforcement unchanged.

Database-relevant Supabase changes still fail closed when the provider-owned `Supabase Preview` check is absent or non-successful. Non-database PRs no longer allocate a separate applicability runner.
