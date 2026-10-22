# Append-only canonical migration-oracle timestamp repair — 2026-10-22

- Obligation: ci-brain-canonical-migration-name-parity-20261022, parent P0 #3742 and related portal P0 #4215.
- Actual independent full BRAIN run 39755490943: 3552 tests / 3198 pass / 354 fail, BEFORE this change and on a different head.
- Cause: five historical source contract tests reference obsolete planned migration timestamps instead of existing versioned SQL files.
- Change: only source-read paths in five original tests; original positive and negative assertions preserved byte-identically.
- Regression: tests/brain-canonical-migration-timestamp-oracles-20261022.test.mjs imports all five original test suites, checks five canonical SQL Git blobs and reconstructs five original test Git blobs.
- No RLS, tenant, schema, executable SQL, cron, provider, workflow or production code changed. No duplicate migrations created.
- Release remains blocked until Required, CodeQL, complete zero-failure BRAIN, historical migration parity and authenticated two-tenant acceptance.
