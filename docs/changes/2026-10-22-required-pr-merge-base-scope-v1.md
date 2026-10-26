# Required PR scope integrity — verified merge base

**Parent:** P0 #4215; canonical owner PR #4630 remains a separate writer-leased SQL recovery. **Status:** candidate; not merged and no claim of revenue recovery.

## Production-adjacent CI failure
[Required #39861215523](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39861215523) incorrectly reported `SCOPE_CONTAMINATED`, counting 126 unrelated changed paths for #4630, while GitHub's actual PR comparison exposes six in-scope files. The branch remained behind current main; the two-dot `git diff main head` included unrelated main modifications.

## Bounded remediation
Resolve `GET compare/<exact base>...<exact head>` through authenticated GitHub API, validate both provider base/head SHA against immutable event identities, and use its merge-base SHA as the PR scope and learning-comparison boundary. Missing, contradictory or malformed proof fails closed. Merge-group/non-PR semantics remain unchanged. Existing `evaluateBranchHygiene` and every Required/CodeQL/Supabase/protected-merge gate retain their original policy.

## Regressions and release
`tests/delivery-branch-hygiene-guard.test.mjs` and `tests/brain-required-merge-base-scope-v1.test.mjs` cover valid divergence, provider forgery, stale/mismatched identity, real forbidden files, and merge-group unaffected behavior. Canonical Brain evaluation runs in historical, shadow and canary. Merge this CI-scoped patch only via protected Required+CodeQL and exact-main readback. Then a **fresh** #4630 Required run must independently prove it is no longer falsely blocked. It still needs full financial/tenant parity, under-120-second snapshot and real cron #46 success; no timeout inflation or false-green allowed.
