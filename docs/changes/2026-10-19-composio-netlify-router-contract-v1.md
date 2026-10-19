# Netlify production bridge: session tool routing contract — 19 October 2026

## Measured current state
The Netlify auth-config screenshot showed one active and one expired historical DCR OAuth account. After the user connected the account, **production** Supabase Edge logs at 09:16:45 and 09:17:02 UTC showed `authorized_netlify_found=true`, `active_exact=1`, `scanned_accounts=50`. GitHub OIDC claims were verified. The independent read-only health workflow [run 39228816062](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39228816062) failed with HTTP 423 `composio_pinned_session_execute_failed`, while Edge logged `composio pinned session execute 400`. An active account by itself is not a successful provider/tool invocation.

## Underlying versioned contract
- Composio sessions default to discovery/meta tools. An allowlisted toolkit does not imply its app tools are preloaded. Source: https://docs.composio.dev/docs/configuring-sessions
- Explicit `preload.tools` may supply reviewed slugs. Only the Netlify project reader and deploy-services updater are permitted.
- Composio `/api/v3.1/tool_router/session/{id}/execute` returns `data` / `error` / optional `result_type`, not obligatorily `successful:true`. Source: https://docs.composio.dev/reference/api-reference/tool-router/postToolRouterSessionBySessionIdExecute

## Correction and safety
The existing Netlify deployment bridge preloads exactly the two reviewed Netlify tools and accepts only a successful HTTP response containing a result body with no provider error (including inner false success). The explicit exact active connected account pin and GitHub main-only OIDC validation remain unchanged. Health always performs read-only get-project with exact site ID; it cannot deploy. The production upload still requires a fresh provider proxy and downstream SHA/deploy-ID readback. No token, project/user identifier or response-body logging.

## Acceptance, not yet met
1. Node regression `tests/brain-netlify-tool-router-execute-v1.test.mjs` plus full Required CI and CodeQL.
2. Protected merge and Supabase Edge source-byte readback.
3. Authorized OIDC-only health probe: actual Composio Netlify get-project must succeed for site `fd527056-493a-4d8a-8125-d00370104fa3`.
4. One authorized production deployment of latest protected GitHub main; Netlify published deploy `commit_ref` and public release.json must equal it. Authenticated Portal and CMS readback thereafter.
5. Do not close the P0 issue or mark the release live until 3–4 are independently verified.
