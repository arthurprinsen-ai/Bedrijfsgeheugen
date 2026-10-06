# Development ledger — Main drift same-lineage refresh

Date: 2026-10-06
Obligation: main-drift-same-lineage-refresh-20261006-v1

Recovery now classifies a green terminal candidate that is behind main as MAIN_DRIFT_RECOVERY. Same-lineage refresh requires an exact writer lease, a captured main SHA, a merge base and zero changed-path overlap. The regression is covered by tests/delivery-powerhouse-supervisor.test.mjs.
