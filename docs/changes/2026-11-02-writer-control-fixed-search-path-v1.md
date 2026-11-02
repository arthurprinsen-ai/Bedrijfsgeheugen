# Security: fixed PostgreSQL function search paths

Scope: three existing `writer_control` functions that manage the exclusive integration lease. The source change **pins** their search path to `pg_catalog, writer_control`. Existing SECURITY INVOKER mode, qualified table references, privileges and semantics remain unchanged. The migration aborts on missing function identity or unexpected definer conversion, and reads back every proconfig.

No credential changes, tenant policy changes, direct production DDL, background scheduler, customer-facing security secrets or relaxed release controls.

Required: original protected CI, CodeQL, BRAIN, Supabase migration replay, exact-main provider migration/version verification, Supabase Security Advisor readback and protected closure. Do not claim WARN count reduced until the original provider independently reports it. The separate anonymous token-gated privileged RPC remains intentionally unmodified pending call-path review.
