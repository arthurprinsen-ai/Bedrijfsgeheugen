# P0 legacy daily blog watchdog fail-closed correction — 2026-10-29

- Incident: `SEC-2026-10-29-TWINFIELD-EXPOSURE`, existing public GitHub issue #5072.
- Confirmed source recurrence: legacy `daily-blog-live-watchdog.yml` creates private Brain/change/development-ledger files and stages them in an external public GitHub PR.
- Remediation: read-only HTTP live verification, `contents: read` workflow authority, no `git add`, `git push`, `gh pr create`, Brain/ledger file writes or parallel writer.
- Existing canonical Powerhouse daily publisher remains operational; trigger schedule for the read-only monitor stays unchanged.
- Regression: `tests/brain-daily-blog-watchdog-no-public-private-proof.test.mjs` runs in the workflow and protected tests.
- Release contract: single PR, protected admission/Required/CodeQL, then independently inspect `main`; no bypass or second scheduler.
- Historical incident remains CRITICAL OPEN for preexisting PR diffs and personal-data assessment.
