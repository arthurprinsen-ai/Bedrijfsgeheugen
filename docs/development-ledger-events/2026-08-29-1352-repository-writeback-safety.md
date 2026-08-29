# 2026-08-29 13:52 CEST — RECOVERY + IMPROVEMENT + PRODUCTION_PROMOTION — Repository Writeback Safety

- **Fingerprint:** `ci|main-writeback|deterministic-noncancellable-writer-contract`
- **Signals:** multiple workflows can mutate `main`; paginacontrole main-write runs were cancellable/per-ref, while Weekblog and Blog bijwerken explicitly delegated `git add`, `git commit`, `git pull` and `git push` to the Claude content agent.
- **Impact:** a newer run or parallel publisher could interrupt a repository transaction, while AI-owned staging could accidentally include unrelated files or apply inconsistent conflict/retry behavior.
- **Root cause:** repository mutation ownership was distributed across AI prompts and workflow-specific concurrency semantics instead of one deterministic writer contract.
- **TDD RED:** Shared Agent Memory run `33250737282` failed on test-first branch `automation/repo-writeback-safety-v2` before the writer safety implementation. Intermediate failures exposed two obsolete tests that asserted the spelling of `git push` rather than synchronization semantics; those tests were corrected instead of weakening synchronization.
- **Fix:** dedicated main writers use `concurrency.group=repo-schrijven` with `cancel-in-progress=false`; paginacontrole keeps per-PR cancellable isolation but every non-PR writer run resolves to `repo-schrijven` and is non-cancellable; Weekblog and Blog bijwerken remove Bash/git ownership from Claude and use deterministic changed-file allowlists plus separate validated staging/commit/push steps; Approved central blog makes its validated writeback step explicit; no force push or broad `git add -A` is allowed.
- **Regression gates:** `tests/repo-writeback-safety.test.mjs`, `tests/paginacontrole-concurrency.test.mjs`, `tests/paginacontrole-concurrent-push.test.mjs`, and the production promotion concurrency regression run together in Shared Agent Memory CI.
- **GREEN candidate:** exact SHA `21e543070ab64ae2917e7944332f4f6519522d34`; branch Shared Agent Memory run `33251009044` success; PR Shared Agent Memory run `33251026917` success; Business OS Migration run `33251026915` success; Business OS Live Preview run `33251026920` success including exact preview, desktop and mobile interaction checks.
- **Promotion:** PR #161 merged exact candidate to signed production SHA `2629a481e7e505e9f6edf757753a4c8a58915d91`.
- **Production deploy:** Netlify deploy `6a92c7a84db6580008d361a4`, context `production`, state `ready`, exact `commit_ref=2629a481e7e505e9f6edf757753a4c8a58915d91`, published `2026-08-29T11:51:28.124Z`.
- **Protected verification:** public HTTPS homepage smoke succeeded; 68 redirects and 16 headers processed without errors; 3 functions and 1 edge function deployed; 646 files secret-scanned with 0 matches.
- **Last-known-good before promotion:** `5bd72ee4be106fcbc2138de382b7bb3d05be3e0d`.
- **Rollback:** revert to the parent production SHA if a repository publication regression appears. No rollback was required during promotion.
- **Owner:** QA/Regression + Knowledge/Governance + publishing workflow owners.
- **Reusable lesson:** AI may generate content, but repository mutation must be deterministic, narrowly allowlisted, serialized across main writers, non-cancellable once writing begins, and tested on behavior rather than incidental command spelling.
