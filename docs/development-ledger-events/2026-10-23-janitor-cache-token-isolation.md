# CI Janitor cache-token minimization — 2026-10-23

Canonical #4661; fingerprint `delivery|ci-security|privileged-janitor-no-cache-tokens|20261023-v1`. GitHub official workflow syntax supports job-level `cache-mode: none` (GA Sep 2026); default trusted `workflow_dispatch` and `schedule` jobs can otherwise receive cache-write access even if their workflow doesn't use a cache.

Source inspection: existing `Powerhouse Repository Janitor` has one cron `17 * * * *`, one `janitor` job, top-level write permissions to actions/contents/PRs/issues, concurrency group and no cache action or package manager cache flag. Lock down only cache tokens; preserve identical functional steps, throughput observation and evidence archive.

Prevention replay `tests/brain-janitor-cache-token-isolation-20261023.test.mjs`; canonical Brain learning above. No automatic cache write enabling, duplicate cron/runner, CodeQL weakening, provider bypass or claimed speedup. Candidate until protected Required+CodeQL, exact-main protected merge, skill projection and Janitor run on merged SHA are independently proved. #4661 and provider #4655 remain open.
