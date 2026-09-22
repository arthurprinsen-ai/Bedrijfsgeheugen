# LinkedIn Composio v3.1 execution recovery

Fingerprint: `linkedin-composio-v31-execution-v1`

## Incident

The first production capability readback reached the deployed LinkedIn verifier successfully, but Composio returned HTTP 400 for `LINKEDIN_GET_MY_INFO`. The runtime was using `/api/v3/tools/execute/*`, where tool execution can resolve to the legacy pinned toolkit definition.

Production evidence:
- Supabase Edge Function: `powerhouse-composio-linkedin-setup` v1
- Provider request id: `2158`
- Result: `COMPOSIO_LINKEDIN_GET_MY_INFO_400`
- No LinkedIn write tool was executed.

## Root cause

The capability verifier used Composio API v3 tool execution without forcing the latest LinkedIn toolkit definition. That made the runtime contract different from the current LinkedIn toolkit documented by Composio.

## Fix

- Use `https://backend.composio.dev/api/v3.1/tools/execute/{tool_slug}`.
- Explicitly pass `version: "latest"`.
- Use structured `arguments` instead of natural-language input for capability probes.
- Call `LINKEDIN_GET_MY_INFO` with an empty argument object.
- Call `LINKEDIN_GET_COMPANY_INFO` with approved administrator filters and bounded pagination.

## Prevention

Provider dashboard connectivity is never sufficient proof of runtime compatibility. Every external-provider capability must be validated by an actual production readback using the same API version and request shape that the runtime will use.

Personal LinkedIn identity and company-page capability remain separate checks. This verifier remains read-only; `powerhouse-social-publisher` remains the only owner of publication side effects.

## Required terminal proof

Exact-head CI must be green, the PR must merge, the Supabase Edge Function must be redeployed, and the provider readback must return canonical personal/company capability state before this recovery is considered complete.
