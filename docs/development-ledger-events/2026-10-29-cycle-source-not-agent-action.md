# Development ledger — correctie bronwaarheid besluitcyclus, 29 oktober 2026

Obligation `powerhouse|portal|sql-cycle-events-mislabelled-agent-actions|20261029`.

Production measurement: 1.585 cycle-events in prior 24h, of which 1.550 originate from SQL sales-action stages, 31 from channel-decision stages, 4 runtime-source signals; none have complete agent identity + skill version + before and after effects.

Action: amend existing read-only admin projection and corresponding Portal V2 System Map panel to show four explicit origin counts. Retain true attribution counters and unknown/red state. No writing to canonical tables, no new scheduler, no fictitious actor identity, no social send.

Proof: existing strict source-count pagination, tenant, auth regression plus new true-origin vs agent distinction tests. Protected release and provider readback required; not an autonomous-lead/revenue outcome.
