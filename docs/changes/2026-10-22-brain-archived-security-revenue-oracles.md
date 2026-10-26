# Historical BRAIN SQL contract pointers (22 October 2026)

Parent P0: #3742. Related acceptance P0: #4215. Obligation: `ci-brain-archived-security-revenue-oracles-20261022`.

Four unchanged, pre-existing security/revenue/structural/prospective contract suites were failing `ENOENT` because they attempted to open migrations retired from `supabase/migrations`. Their byte-identical Git objects are preserved as non-executable evidence under `supabase/migration-history/repository-only/`.

This change redirects exactly one source path in each of four existing tests. No original safety assertions are changed or skipped. An independent regression checks content SHA, nonempty SQL, archive-path linkage, and absence of an executable migration duplicate.

- `tests/supabase-powerhouse-revenue-acceleration-mode-v1.test.mjs` → `20260915143000_powerhouse_revenue_acceleration_mode_v1.sql` (Git blob `59a2a9895df32660b678b368f92ea8da23125799`)
- `tests/supabase-powerhouse-security-operations-hardening-v1.test.mjs` → `20260916174000_powerhouse_security_operations_hardening_v1.sql` (Git blob `e729de2cde4a618a8562c1de51e92781077408c8`)
- `tests/supabase-powerhouse-structural-gap-closure-v2.test.mjs` → `20260918090000_powerhouse_structural_gap_closure_v2.sql` (Git blob `c26421ca46f3c24011d314e08686aa2d250a9a95`)
- `tests/supabase-prospective-autonomous-commercial-experiment-v1.test.mjs` → `20260918113000_prospective_autonomous_commercial_experiment_v1.sql` (Git blob `8bd6f9423ab1665d8e9a0771f51f28c9d3a61ec9`)

No production runtime, data, migrations, RLS, scheduler, external delivery, or provider permission is changed. Required CI, CodeQL, full BRAIN 0 failures, Supabase clean-room reconstruction and authenticated tenant tests must remain independent acceptance gates. A green focused test is **not** evidence that all inherited BRAIN failures are resolved.
