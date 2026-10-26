# Development event: commercial scheduler continuity

- Date: 2026-10-11
- Parent: P0 #4198
- Incident: Reconciliation error prevented the scheduled content dispatch.
- Root cause: A readback step was treated as a mandatory prerequisite for unrelated publication channels.
- Correction: The existing launcher isolates observational reconciliation errors and keeps its original scheduled publishing workflow running every hour.
- Production evidence: Existing job 140 is active on an hourly schedule. Function authorization and access control were confirmed unchanged.
- Regression: tests/brain-commercial-content-continuity-v1.test.mjs
- Source: supabase/migrations/20261011110000_powerhouse_content_reconciliation_isolation_always_on_v1.sql
- External publication evidence: Not established by this repair.
- Outcome: Production scheduler correction confirmed; commercial results remain separately verifiable.
