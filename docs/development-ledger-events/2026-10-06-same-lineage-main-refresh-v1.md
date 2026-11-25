# Development ledger — same-lineage main refresh v1

- Date: 2026-10-06
- Failure class: zero-overlap moving-main drift repeatedly retired valid terminal PRs and created successors.
- Root cause: successor policy and terminal-write/predictive/recovery execution semantics contradicted each other; recovery also hard-coded one writer owner.
- Fix: zero-overlap drift -> same-lineage CAS refresh; overlap -> same-lineage reconciliation; successor only after unsynchronizable proof.
- Metadata closure: refresh updates Base-SHA, Writer-Lease-Head and Writer-Lease-Main-Epoch.
- Premature close: any structurally valid terminal lease is auto-reopened until merged or explicitly released.
- Safety: ordinary terminal content mutation remains immutable; stale head and overlap remain fail-closed.
