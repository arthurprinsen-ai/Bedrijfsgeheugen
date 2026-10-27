# Supabase provider migration lineage reconciliation — 2026-10-20

Canonical obligation: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Root cause: an approved GitHub migration on merge and an authorized direct Supabase migration application overlapped because the GitHub-initiated production application was not yet visible at the first readback. Both committed the **same** idempotent Source Universe mux SQL at distinct migration versions, not a duplicate scheduler.

Provider-observed versions (both applied):
- `20261020070155 restore_external_intelligence_existing_mux_v3` — direct production migration transport
- `20261020080000 restore_external_intelligence_existing_mux_v3` — canonical source migration transport

Reconciliation: keep both audit records; mirror the exact SQL under both versioned files to avoid future remote-only drift. Do not delete provider history. The live function definition, ACL and bounded canary were verified independently; cron 171 remains the sole canonical runtime scheduler. Actual future automatic UTC :54 execution remains a separate receipt obligation.

Prevention: branch/migration author must query actual applied migration versions and provider function definition **after** the GitHub deployment has settled and before considering any manual production apply. Provider-readback outranks pending UI status. Add this event to the existing Powerhouse learning lineage and do not falsely claim the entire tenant portaal/forecast/outcome P0 is green.
