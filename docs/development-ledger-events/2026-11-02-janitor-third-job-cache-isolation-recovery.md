# 2026-11-02 — third original Janitor job cache security fixture drift

- **Full source evidence:** original unified BRAIN #41418160550 backend job #125187272147: 5377 / 5348 pass / 27 fail.
- **Root cause:** source test `tests/brain-janitor-cache-token-isolation-20261023.test.mjs` assumes exactly two jobs despite independently verified 3 original jobs, including bounded branch_archive_sweep after Janitor.
- **Security:** existing `janitor` and `branch_reconciler` remain cache-mode none; independent archive sweep no actions/cache, needs:janitor, 20min job timeout, 900s bounded budget, cap150. No change to trusted GitHub actions permissions, existing cron or branch cancellation.
- **Fix:** test asserts exact original three jobs and independent archive guard, keeps first two original cache checks and all other security cases. Original AGENTS, Continuity Skill, ONE BRAIN learning replay/shadow/canary and human documentation in same protected candidate.
- **State:** CANDIDATE_NOT_PROVEN until protected Required+CodeQL, exact main merge, original full BRAIN/terminal and natural provider readback; no new scheduler, publisher, SQL, business impact or false GREEN.


### Additional bounded branch-synchronization assertion
The independently failed `tests/brain-autonomous-branch-sync-4914.test.mjs` used `workflow.split('  branch_reconciler:\n')[1]` as an unbounded suffix, then `doesNotMatch(reconciler,/^    needs:/m)`. The appended legitimate `branch_archive_sweep` contains `needs: janitor`, thus false-positive. Now bound the `reconciler` block to the next `branch_archive_sweep` heading, verify no `needs` within its own block, and separately require the archive `needs:janitor` and `timeout-minutes:20`. This is test-only; no source workflow change.
