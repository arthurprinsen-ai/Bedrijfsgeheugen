# 2026-11-02 — Janitor stale-run JSON global TSV fixture drift

- **Original full BRAIN:** #41416918147 backend #125183392982: 5377 tests, 5347 pass, 28 fail.
- **Root:** original test incorrectly banned any `@tsv` in the whole Janitor workflow, though the queued/in_progress Action-run parser already uses `@json | while read -r run_json` and separate bounded merged branch sweep uses `sweep-candidates.tsv`.
- **Safeguard:** retain exact Actions-run JSON for run ID/SHA/time/status; keep branch SHA/open-PR check and protected main/required-head queue cancellation rules.
- **Correction:** only original test scoped its negative TSV assertion to the one original queued/in_progress run loop; positive independent branch sweep fixture retained. Original AGENTS, Continuity Skill, ONE BRAIN learning historical/shadow/canary, human runbook and ledger included.
- **No effect:** no Janitor workflow, GitHub token, cron, DB, publisher, tenant or customer mutation; false-GREEN and test-skipping forbidden.
- **Evidence due:** original full exact-head BRAIN postmerge and terminal, producer readback and natural recurrence check.
