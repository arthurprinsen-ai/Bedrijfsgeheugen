# 2026-09-20 — postgres-view-replace-upgrade-column-order-v1

- PR #2441 passed fresh preview/security/quality gates and merged.
- Production application of `terminal_health_lifecycle_v2` failed before mutation with PostgreSQL 42P16.
- Cause: v2 inserted `blocked_obligations` before v1 output columns in a CREATE OR REPLACE VIEW.
- Production remained on the previous v1 view/function because the migration transaction failed.
- Correction preserves the six-column v1 prefix exactly and appends v2 columns.
- Regression added to enforce output-order compatibility.
- Learning and continuity skill updated; no gate weakened.
