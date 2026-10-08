# POWERHOUSE — Daily engineering tuning: repair the real closed-loop blocker

**8 October 2026.** Obligation: `powerhouse-daily-engineering-tuning-terminal-unblock-20261008-v1`.

## Existing-state-first diagnosis
The existing GitHub scheduled optimizer was running successfully. The 8 October run `37774962097` logged `Existing tuning PR #3296 is still authoritative; no duplicate created.` PR #3296 was created on 29 September 2026 and remained open despite missing delivery metadata (Base-SHA, Change-Scope and Scope-Budget) and all mandatory material Brain-learning and ledger closure. The scheduler was green while engineering self-tuning was blocked.

PR #3296 was audited by GitHub comment and closed without merge. Its old proposed settings were not promoted or silently overwritten.

## Repair
Reuse the **same** scheduled GitHub Actions workflow and existing canonical tuning file. Add a deterministic candidate compiler (`tools/delivery/daily-engineering-tuning-candidate.mjs`) which emits a protected change containing exactly four paths: tuning configuration, Brain learning, human explanation and append-only development ledger. No parallel scheduler, database, authority or Brain.

The workflow now validates the precise bot-owned tuning PR title and branch. It retains valid open PRs; refuses to touch human/unrelated branches; fails closed on an unverified or too-recent invalid candidate; and retires only a proven invalid bot-owned PR older than 48 hours with an audit comment. New candidates verify main HEAD against the provider before writing, and attach strict metadata, exact changed path scope, and an irreversible guard against weakening Required, CodeQL, exact SHA and protected promotion.

If registration for protected auto-merge fails, the workflow fails loudly rather than reporting a successful self-optimization.

## Evidence and tests
- Historical incident: [PR #3296](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/3296), [daily optimizer run 37774962097](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/37774962097)
- Regression: `tests/brain-engineering-tuning-candidate.test.mjs`
- Existing measurement: PR #4167 and PR #4172 (required gates, post-change observation, safe rollback)
- New delivery: exact-head Required, CodeQL, protected merge and relevant terminal outcome must be independently verified. A valid submitted tuning PR is not verified improvement.

**State:** candidate until protected production proof and next scheduled/dispatch run.
