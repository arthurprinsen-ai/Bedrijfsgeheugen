# Netlify deployment bridge — active connection is not provider authority

## Measured condition (19 October 2026)
After the Netlify auth renewal in the existing Composio project, Supabase logs at 09:25–09:34 UTC show `authorized_netlify_found:true`, exactly one active matching Netlify account among 50 connected accounts, no missing identity or disabled account. This resolves the previous HTTP 420 account discovery condition.

However the existing main-only OIDC bridge still returns HTTP 400 from Composio `/tool_router/session/{id}/execute` on the **read-only** `get-project` health request: `NETLIFY_SESSION_TOOL_REJECTED {kind:"read",result_type:"missing",error_kind:"OTHER"}`. Hence no permitted source-pinned Netlify deploy. Run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39230936665 .

## Bounded recovery candidate
- In the documented v3.1 session request, add `tools:{netlify_mcp:{enable:allowed}}` to scope app-tool exposure to **only** the two existing, preloaded vetted Netlify tools.
- When a 400 persists, retrieve `GET /tool_router/session/{id}/tools` read-only and record a boolean for requested tool exposure, together with a whitelisted validation field and type. Do not log raw provider responses, arbitrary untrusted messages, connected account IDs, API keys, OIDC tokens, or proxy links.
- Existing JWT repository/ref/workflow constraints, pinned Supabase Vault, site ID, read-only health, provider authorization, and protected GitHub delivery are unchanged.

## Evidence / acceptance
`node --test tests/brain-netlify-session-tool-exposure-v1.test.mjs` + Required CI + CodeQL; protected merge; independent byte-for-byte Supabase deployed function parity; actual OIDC health with site readback; then immutable Netlify exact-main SHA and authenticated production browser proof. This is a diagnostic/least-privilege correction, NOT proof the Composio HTTP 400 is resolved. Do not mark live on account visibility alone.

External contract: https://docs.composio.dev/docs/configuring-sessions and https://docs.composio.dev/reference/api-reference/tool-router/postToolRouterSessionBySessionIdExecute .
