# Terminal evidence timeout retry — 2026-10-06

A terminal-closure run can receive HTTP 422 with `The operation was aborted due to timeout` even after Supabase has durably committed the terminal state. That produced a false-negative closure and unnecessary recovery work.

The closure workflow now retries the identical evidence payload exactly once, and only for that timeout signature. The write path is already idempotent by obligation/main identity, so this retry cannot create a second terminal record.

All other non-2xx responses still fail closed. The durable readback assertions remain unchanged and must still prove `FULFILLED`, exact candidate/main identity, production readback, and any required migration/provider readback.
