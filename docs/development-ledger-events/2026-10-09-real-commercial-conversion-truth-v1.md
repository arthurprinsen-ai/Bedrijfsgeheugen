# Development ledger — 2026-10-09 commercial truth recovery

- Live defect: `powerhouse_sales_outcome_close_loop_v2`, triggered on original `powerhouse_sales_outcomes` INSERT/UPDATE. Internal events became `growth_outcomes` lead plus `powerhouse_realized_values` conversion=1.
- Production counts before patch: 1,349 false derived leads, 1,349 false realized conversion rows. Zero associated revenue; all original outcome types and evidence retained.
- Candidate SQL: `20261009190000_fix_noncommercial_conversion_projection_v1.sql`, fail-closed for non-qualified events and cleans only linked derived projections by source/outcome and zero revenue. No new cron, sender, or CRM.
- Targeted replay and shadow regression: `tests/brain-real-commercial-conversion-truth-v1.test.mjs`; semantic Brain learning present.
- Acceptance: protected CI and release; database post-migration SELECT verifies corrected counts, `bg_gezondheid` immutable reconciliation audit; real provider interactions remain independently assessed.
- Important: historical reply and scan test fixtures are not evidence of 2026-10-09 real SalesRobot campaign conversions.
