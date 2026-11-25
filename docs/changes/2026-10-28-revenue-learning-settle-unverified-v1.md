# Revenue learning: settle rows without a verified source

Every hourly `revenue-learning-evaluate` run attempted 8 due rows and evaluated none: rows without a verified source only got an obligation and stayed due forever, so the backlog (103 rows) never shrank. Such a row is now marked evaluated after its obligation is recorded, and reopens only when its data changes. Rows that fail only on cohort size or metric stay due, because they depend on other rows. The run summary reports `settledUnverified` next to `evaluated`.

## Validation

`node --test tests/revenue-learning-evaluate.test.mjs tests/brain-revenue-learning-unverified-settle-20261028.test.mjs`

## Boundaries

Must land after PR 5019 (evidence timestamp guard) is applied; otherwise the hourly projection refresh advances `updated_at` and reopens settled rows. Runtime effect is unproven until Netlify logs show `unprocessedDue` falling.
