# Development ledger — recovery supervisor metadata regex corruption v1

- Date: 2026-10-06
- Obligation: `recovery-supervisor-metadata-regex-20261006-v1`
- Failure class: `RECOVERY_SUPERVISOR_SELF_EMBEDDED_REGEX`
- Before: recovery supervisor 512 lines, duplicate workflow header and duplicate `jobs:` block embedded inside the metadata updater.
- Root cause: malformed RegExp replacement introduced by the same-lineage refresh change.
- Fix: replace machine-readable PR metadata using one line-anchored expression per field.
- After: one workflow document, one `jobs:` block, one metadata generator.
- Regression: `tests/delivery-recovery-supervisor-metadata-regex-v1.test.mjs`.
- Safety preserved: queue-storm guard, bounded recovery, exact-head admission and same-lineage refresh remain fail-closed.
