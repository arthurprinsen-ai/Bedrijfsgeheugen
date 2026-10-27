# Netlify backup — Composio v3.1 session create wire contract

## Causal hypothesis with reproducible source defect
The historical `tool_router/session` **request** incorrectly used `toolkits.enabled`, although the official SDK and API document request-side `toolkits.enable`. An `enabled` property occurs in normalized **response** examples and cannot be copied into new-session JSON. This is a real client schema defect; that it fully explains observed provider HTTP 400 `TOOLKIT_CONSTRAINT` is pending live testing.

The later v169 direct tool fallback was also rejected (Composio HTTP200 with `successful:false`). The masked API keys displayed by the owner both show **Full access**. No secret value has been read, and no missing API permission or required key rotation has been proven.

## Correction
Within the existing project-scoped Supabase OIDC bridge, create one session as the existing connection's user with `toolkits: {enable:['netlify_mcp']}`, pin `connected_accounts`, disable instant, manage-connections, workbench, search and multi-execute. Never take toolkit, account, user, Netlify site or tool name from the HTTP request body. The health branch may only call the Netlify reader `get-project`, requiring a match to fixed site identity; the runtime fallback is restricted to fixed `deploy-site` and exact source readback.

Session creation and tool execution both fail closed if Composio returns non-2xx or `successful !== true`. Diagnostic logs contain only HTTP code and allowlisted field names; do not expose raw bodies, user/account IDs or OAuth material.

## Evidence requirements
1. Canonical Required CI, CodeQL, protected merge.
2. Supabase Edge Function source bytes equal protected GitHub main.
3. Authenticated OIDC health-only workflow and true provider project read succeed.
4. Real authorized Netlify fallback deployment, deploy ID, exact source SHA and public functional readback.
5. Only after #4, close incident #4447. Preserve existing Powerhouse Growth & Revenue OS owner and CI daily authority probe, no parallel scheduler, bypass or fabricated success.

Official documentation: https://docs.composio.dev/docs/configuring-sessions
