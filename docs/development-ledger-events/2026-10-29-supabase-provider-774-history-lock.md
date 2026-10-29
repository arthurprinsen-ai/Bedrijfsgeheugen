# Development ledger — 2026-10-29 corrected production migration history

Obligation: `delivery|supabase-preview|live-provider-774-history-lock-drift|20261029`.
Observation 1: 773 provider versions; `20261028220000` not yet applied, table/functions absent.
Observation 2 after protected PR #5104: 774 provider versions; `20261028220000` applied, SQL table/functions present.
Action: safely reverse a **never-merged** tentative source quarantine; keep original executable LinkedIn SQL, update existing lock to all 774 actual applied versions, record evidence and strict regression tests.
No direct SQL, no ledger repair, no hidden retroactive green. Exact project/identity, source SHA and provider readback retained in Brain learning.
Protected candidate required before live source-history closure.

Additional incident 2026-10-29: Supabase Preview on PR #5106 returned `BRAIN_FAILURE_OBSERVE_SOURCE_DRIFT` at earlier migration guard. Direct production function readback: modern evidence-preserving function present, semantic conflict checks and serial locking present, public EXECUTE denied, service_role EXECUTE allowed. Narrow compatibility correction of source replay guard, with strict modern proof and unchanged DDL/function suffix hash. Regression: `tests/brain-incident-observe-safe-replay-20261029.test.mjs` and original incident semantic recovery suite. Await exact-head GitHub/Supabase provider acceptance before any success claim.
