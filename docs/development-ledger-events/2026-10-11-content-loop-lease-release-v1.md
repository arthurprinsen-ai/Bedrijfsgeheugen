# Recovery evidence — content-loop lease release

- Date: 2026-10-11
- Parent: P0 #4198
- Failure evidence: CONTENT_LOOP_LEASE_RELEASE_FAILED / SQL parameter $3 type indeterminate
- Correction: explicit parameter casts within existing lease release JSONB payload
- Scope: supabase/functions/powerhouse-content-loop/index.ts
- Tests: tests/brain-content-loop-lease-release-typed.test.mjs
- Security invariants: same lease holder, same authentication token, same provider and idempotency gates
- Status: production and actual outcome readback required; no publication receipt assumed
