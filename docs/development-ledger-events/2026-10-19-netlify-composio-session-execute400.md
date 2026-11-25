# Netlify pinned-account provider execution — 2026-10-19

Obligation-ID: `netlify-bridge-account-execute400-20261019`
Fingerprint: `netlify|composio-v3.1|single-account-session-execute400|20261019`
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4437

## Provider evidence (no invented success)
Before account reconnection, the OIDC-authorized bridge scanned 54 accounts with no ACTIVE `netlify_mcp`. After the user's Netlify connection was renewed, production logs at 09:57 UTC found one ACTIVE exact Netlify account, with `requested_tool_exposed=true`, but a read-only provider-health execution still failed with HTTP 400 `composio pinned session execute 400`. The requested tool was exposed in the verified session; this is *not* the original HTTP 420 missing-account failure.

## Contract-directed correction
Composio's official session execute contract documents the top-level `account` field for multi-account selection; in single-account sessions the default is selected. The bridge already pins exactly one ACTIVE account to its `connected_accounts` session. Remove only the redundant top-level account override from `session/{id}/execute`. Do not disable session tool restrictions, loosen OAuth, change the deployment site, enable provider side effects for health checks, or synthesize authorization.

## Required acceptance
`node --test tests/brain-netlify-single-account-execution-v1.test.mjs` and existing bridge regressions; Required CI + CodeQL; protected merge; exact GitHub release and Supabase Edge provider source parity; actual OIDC health probe returning HTTP 200 with verified site; exact current-main Netlify production deploy SHA and authenticated portal browser readback. Failure to pass any gate keeps this issue OPEN. The user-visible chat's separate Netlify connection is not production bridge proof.

Docs: https://docs.composio.dev/reference/api-reference/tool-router/postToolRouterSessionBySessionIdExecute
