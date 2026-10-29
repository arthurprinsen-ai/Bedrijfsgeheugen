# Legacy watchdog stale ledger reconciliation — 2026-10-29

- Incident: `SEC-2026-10-29-TWINFIELD-EXPOSURE`, source PR #5089 already merged and verified read-only.
- Source evidence: `data/content-publication-ledger.json` has five dates through 2026-10-09; manual run #40856082954 for 2026-10-25 failed at ledger lookup before any side effect.
- Positive control: manual run #40856250847 for 2026-10-09 succeeded with 2/2 security tests and real public readback; no Git writes.
- This candidate only changes exact date fallback, readback step gating and existing negative regression tests.
- Missing current date = explicit `NO_ACTION`, never synthetic historical success or false incident severity. Canonical Supabase Powerhouse owns new blog obligations.
- Required/CodeQL and protected merge plus read-only runtime readback mandatory; no bypass or additional scheduler.
