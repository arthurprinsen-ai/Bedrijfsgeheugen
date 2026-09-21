# 2026-09-21 — Composio cross-runtime secret binding

- Fingerprint: `composio-cross-runtime-secret-binding-v1`
- Observed: COMPOSIO_API_KEY exists in Netlify production but is absent from the Supabase secret runtime used by the Instagram publisher.
- Root cause: environment boundaries were treated as if secrets propagated across runtimes.
- Change: add bounded Netlify -> Supabase server-to-server secret projection using the existing validated onboarding endpoint.
- Security: secret is read only from Netlify runtime; not committed, logged, echoed, or placed in browser state.
- Resource rule: status-first; no write when Supabase already has the key.
- Recovery ownership: publication remains under `powerhouse-content-closed-loop-v1`; no second publisher is introduced.
