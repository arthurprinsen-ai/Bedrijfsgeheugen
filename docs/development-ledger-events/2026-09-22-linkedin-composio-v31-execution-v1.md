# Development ledger — linkedin-composio-v31-execution-v1

- Date: 2026-09-22
- Production readback: request 2158 reached the deployed capability verifier but returned HTTP 503 because Composio returned HTTP 400 for `LINKEDIN_GET_MY_INFO`.
- Root cause: the verifier used `/api/v3/tools/execute/*`; v3 can resolve to the legacy pinned tool version.
- Fix: use `/api/v3.1/tools/execute/*`, explicitly pass `version: latest`, and use structured arguments.
- GET_MY_INFO arguments: empty object.
- GET_COMPANY_INFO arguments: approved administrator role, bounded pagination.
- Safety: verifier remains read-only; no LinkedIn write tool added.
- Terminal proof required: exact-head CI, merge, Supabase Edge Function redeploy, provider readback, canonical Brain state.


## Shared social publisher follow-through

The same provider-version invariant applies to `powerhouse-social-publisher`. Its Composio Instagram execution path must use `/api/v3.1/tools/execute/*`; v3 is not an allowed direct-tool endpoint. v3.1 may use either structured `arguments` or natural-language `text` as defined by Composio, while canonical publication authority, exact-media proof, dedupe and provider readback remain unchanged.
