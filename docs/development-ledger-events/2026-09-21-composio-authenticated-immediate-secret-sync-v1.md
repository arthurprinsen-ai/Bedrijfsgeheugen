# 2026-09-21 — Authenticated immediate Composio secret sync

- Fingerprint: `composio-authenticated-immediate-secret-sync-v1`
- Production observation: key is configured in Netlify, exact production deploy/event reaches Supabase, but setup readback remains `api_key_present=false`.
- Proven root-cause boundary: event-path secret visibility is inconsistent; underlying provider-side cause is not yet proven.
- Change: add POST-only authenticated serverless control endpoint that reuses canonical `syncComposioSecret()`.
- Authentication: hash comparison against existing Powerhouse scheduler token; raw token is not committed.
- Security: no Composio secret echo/logging; no browser dependency; no publishing authority.
- Terminal proof target: authenticated production call -> Supabase key present -> setup-state readback.
