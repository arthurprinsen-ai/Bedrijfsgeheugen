# Recovery Supervisor: zero observed drift is not complete coverage
23 October 2026 | canonical owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4120
Protected prior release #4791 produced its first real artifact on live run https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39966378899. It contained 0 emitted drift events while the log showed the scheduler processed failed gate PRs and used its one-PR recovery budget.
The old reducer marked source_snapshot_complete=true from exit code success alone; this is a material observability false-completeness error, not proof that no main drift exists.
The existing metrics reducer now reports coverage_state PARTIAL_OR_UNPROVEN, source_snapshot_complete=false, unknown eligible/classified denominators (null), and explicitly disallows a global no-drift claim.
No change to Recovery Supervisor workflow, writer/CAS/attempt budgets, scheduler, portal, Supabase, Required or CodeQL. Canonical regression: tests/brain-recovery-supervisor-drift-metrics-v1.test.mjs. Full coverage can be proved only when the existing supervisor exposes independently verifiable scan denominators.
