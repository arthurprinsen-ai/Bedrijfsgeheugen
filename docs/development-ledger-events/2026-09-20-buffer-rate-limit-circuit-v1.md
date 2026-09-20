# Development ledger — buffer-rate-limit-circuit-v1

Date: 2026-09-20  
Obligation: `buffer-rate-limit-circuit-v1`  
Lane: backend  
Failure class: `CONNECTOR_FAILURE`

## Observed
Buffer response: HTTP 429, `BUFFER_RATE_LIMITED`, retryable=true, Retry-After present. LinkedIn personal bleef correct `content_ready`, zonder delivery_ref en zonder dubbele publish capability.

## Root cause
Retry state was ephemeral; the five-minute content loop had no canonical circuit breaker.

## Prevention / change
Persist the provider reset, defer only Buffer-backed LinkedIn lanes, preserve idempotent content state, allow independent Composio Instagram work, and automatically retry only after the reset.

## Evidence
- `supabase/functions/powerhouse-social-publisher/index.ts`
- `tests/brain-buffer-rate-limit-circuit-v1.test.mjs`
- `brain/learning/2026-09-20-buffer-rate-limit-circuit-v1.json`
- `docs/changes/2026-09-20-buffer-rate-limit-circuit-v1.md`
