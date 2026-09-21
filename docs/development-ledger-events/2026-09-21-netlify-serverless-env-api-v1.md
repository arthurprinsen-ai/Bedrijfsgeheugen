# 2026-09-21 — Netlify serverless env API repair

- Fingerprint: `netlify-serverless-env-api-v1`
- Observed: COMPOSIO_API_KEY exists in Netlify production with functions/runtime scopes, while Supabase still reported api_key_present=false after deploySucceeded executed.
- Root cause: serverless code used Edge Functions API `Netlify.env` instead of `process.env`.
- Change: switch all secret-bridge environment reads to `process.env`.
- Security: no secret value is logged, returned, committed, or moved through browser state.
- Runtime ownership: no new publisher or scheduler introduced.
- Verification target: production deploy -> deploy event -> Supabase key present -> Composio setup readback.
