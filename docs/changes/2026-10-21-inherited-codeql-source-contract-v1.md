# Inherited BRAIN CodeQL source-contract repair

- Fingerprint: `brain|historical-codeql-source-contract|20261021-v1`
- Parent obligation: #3742; blocked delivery: #4573.
- Observed BRAIN failure: [run 39554866582](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39554866582), backend job 119072398429, one `ENOENT` at `tests/brain-ci-critical-path-acceleration-v2.test.mjs` among 355 inherited failures.
- Root cause: the historical test opens retired `.github/workflows/powerhouse-codeql.yml` and checks the old scope job; authoritative current main uses `.github/workflows/codeql.yml` with a two-language CodeQL analyze matrix.
- Repair: only the test oracle is updated; assert protected PR, merge_group, main triggers, CodeQL matrix, security-extended queries, SARIF error-on-missing, and job timeout. No scan gate or workflow softened.
- Verification: all 11 newly specified workflow-source patterns matched the exact base SHA's current `codeql.yml`. This is source-level verification, **not** a passing Node test or CI receipt.
- Release: draft only until protected exact-head Required, CodeQL and the complete BRAIN suite are terminal successful. Historical Supabase migrations and tenant data remain unchanged. Do not declare zero or merge PR #4573 on this partial repair.
