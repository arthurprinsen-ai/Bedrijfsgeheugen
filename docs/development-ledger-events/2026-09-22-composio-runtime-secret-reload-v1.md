# 2026-09-22 — Composio runtime secret reload

- Fingerprint: `composio-runtime-secret-reload-v1`
- Trigger: production Composio credential rotated after provider rejection.
- Observation: active Netlify Functions deployment predates the rotation.
- Action: create one protected deploy-relevant Functions release with no behavior change.
- Terminal proof: post-rotation production deploy plus provider/Supabase readback.
- Secret values are never stored in repository evidence.
