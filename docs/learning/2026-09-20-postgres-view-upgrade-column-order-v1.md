# PostgreSQL view upgrade compatibility — 20 September 2026

The first production attempt of `terminal_health_lifecycle_v2` failed safely with PostgreSQL `42P16`: the v2 `CREATE OR REPLACE VIEW` inserted a new output column before existing v1 columns. A fresh preview database accepted the SQL because no earlier view shape had to be preserved; production correctly rejected the implicit rename.

Permanent rule: canonical views evolved with `CREATE OR REPLACE VIEW` preserve all existing output column names and order as an immutable prefix. New columns append at the end. If order/type semantics must change, use an explicitly reviewed drop/recreate migration only after dependency analysis.

The failed migration did not mutate production. The corrected file keeps the v1 prefix:
`observed_at, nonterminal_obligations, stale_planned_operations, escalated_reconciliation_jobs, stale_green_truths, control_plane_healthy`, followed by new v2 columns.
