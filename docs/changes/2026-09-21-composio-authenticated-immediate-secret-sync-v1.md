# Authenticated immediate Composio secret sync

Date: 21 September 2026  
Fingerprint: `composio-authenticated-immediate-secret-sync-v1`

## Observed production gap

The Composio API key is configured in Netlify production with Functions/runtime scope. Both the scheduled bridge and the production `deploySucceeded` handler reached the canonical Supabase setup function, but the resulting setup state still reported `api_key_present=false`.

The provider-side reason why that event path did not expose the secret has not been proven. The recovery therefore does not invent a root cause.

## Recovery

A dedicated serverless control endpoint reuses the existing idempotent `syncComposioSecret()` operation. It accepts POST only and authenticates `x-powerhouse-token` by SHA-256 against the already-established Powerhouse scheduler secret. It never receives the scheduler secret in source control, never logs it, never returns the Composio key, and cannot publish social content.

## Definition of done

Exact-head gates must pass, protected merge and exact Netlify production deploy must complete, the endpoint must be invoked from Supabase without exposing the raw scheduler token, and Supabase must then prove `COMPOSIO_API_KEY` presence plus the resulting Composio setup state.


## 22 September 2026 — Project API key rotated

The Composio Project API key was rotated in the production hosting environment after the previous provider validation returned a rejected-key response. No secret material is recorded here. The next production deployment must revalidate the provider connection and persist only non-secret readiness evidence.
