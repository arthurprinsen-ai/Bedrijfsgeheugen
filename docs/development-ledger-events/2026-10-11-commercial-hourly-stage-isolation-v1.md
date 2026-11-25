# Development event — 2026-10-11: P0 #4198 commercial cron isolation

- Canonical authority: one existing cron #116; no new scheduler.
- Verified failure: cron job 116 has repeated statement_timeout on 11 October; 14 business stages currently share one transaction.
- Verified positive: cron #138 separately executes contact pulses, 23,295/23,295 reviewed at last readback.
- Candidate: one bounded stage at a time at minutes 3,6,9,12,15,18,21,24,27,30,33,36,39,42, once per UTC hour; original fourteen functions, consent and provider dispatch gates remain unchanged.
- Proof path: protected CI and Supabase Preview; source parity; actual cron job command readback; later cron per-stage receipts; no external delivery assertions from internal receipts.
- Acceptance: failures are independently observable; subsequent stages continue; receipts are idempotent by UTC hour/stage; no bypass or duplicate message; external send remains separately proven.
