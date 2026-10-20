# Development ledger: P0 #4215 — Brain input history

- Obligation ID: p0-4215-business-input-history-pagination-20261009-v1
- Date: 2026-10-09
- Failure class: BUSINESS_INPUT_OLDEST_1000_READBACK_LOSS
- Root cause: the Supabase Edge function had ascending order and limit(1000), discarding all newer customer BusinessInput events from the read-repair.
- Prevention: deterministic tenant-filtered pagination, fail closed on read failures and history cap.
- Replay: tests/brain-p0-4215-business-input-history-pagination-v1.test.mjs
- Evidence required: protected Required + CodeQL, exact main Supabase active runtime, production readback; two real authenticated customers and Brain consumer ACK separately.
